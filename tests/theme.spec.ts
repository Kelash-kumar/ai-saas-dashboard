import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { defaultTheme, normalizeTheme, readThemeDocument, importTheme, exportTheme, THEME_STORAGE_KEY, themeChoices } from '../config/theme';

test.beforeEach(async ({ context }) => {
    const raw = process.env.TEST_ADMIN_COOKIES;
    if (!raw) throw new Error('Authentication fixture unavailable');
    await context.addCookies(JSON.parse(raw));
});

async function choose(page: Page, field: string, label: string) {
    await page.getByRole('group', { name: field, exact: true }).getByText(label, { exact: true }).click();
}

test('theme documents discard unsupported storage, unknown keys and unsafe values', () => {
    expect(readThemeDocument('bad json')).toEqual(defaultTheme);
    expect(readThemeDocument(JSON.stringify({ version: 999, settings: { accent: 'teal' } }))).toEqual(defaultTheme);
    expect(normalizeTheme({ mode: 'dark', accent: 'url(javascript:alert(1))', extra: true })).toEqual({ ...defaultTheme, mode: 'dark' });
    expect(normalizeTheme(null)).toEqual(defaultTheme);
    expect(normalizeTheme([])).toEqual(defaultTheme);
    for (const choices of Object.values(themeChoices)) expect(choices.length).toBeGreaterThan(1);
});

test('theme profiles round-trip and reject incomplete, oversized and future files', () => {
    const theme = { ...defaultTheme, mode: 'dark' as const, accent: 'teal' as const };
    expect(importTheme(exportTheme(theme))).toEqual(theme);
    expect(() => importTheme('not json')).toThrow();
    expect(() => importTheme(' '.repeat(8193))).toThrow();
    expect(() => importTheme(JSON.stringify({ version: 1, settings: { mode: 'dark' } }))).toThrow();
    expect(() => importTheme(JSON.stringify({ version: 2, settings: defaultTheme }))).toThrow();
});

test('shell navigates between real pages without console or hydration errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your workspace, in perspective.');
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Appearance', exact: true }).click();
    await expect(page).toHaveURL(/settings\/appearance/);
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'UI foundations', exact: true }).click();
    await page.getByRole('button', { name: 'Try an action' }).click();
    await expect(page.getByText('You’ve tried this action 1 time.')).toBeVisible();
    await page.getByRole('button', { name: 'Clear count' }).click();
    await expect(page.getByText('Try the primary action to see feedback.')).toBeVisible();
    expect(errors).toEqual([]);
});

test('global preferences survive reload and apply to another page', async ({ page }) => {
    await page.goto('/settings/appearance');
    for (const [field, label] of [
        ['Color scheme', 'Dark'],
        ['Accent color', 'Teal'],
        ['Navigation', 'Compact'],
        ['Content width', 'Boxed'],
        ['Header style', 'Floating'],
        ['Sidebar tone', 'Dark sidebar'],
        ['Interface density', 'Compact'],
        ['Corner style', 'Rounded'],
        ['Typography', 'System font'],
        ['Reading direction', 'Right to left'],
        ['Motion', 'Reduce motion'],
    ]) {
        await choose(page, field!, label!);
    }
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'teal');
    await page.reload();
    await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Compact', exact: true }).first()).toBeChecked();
    await page.getByRole('link', { name: 'UI foundations', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-font', 'system');
    await expect(page.getByRole('cell', { name: 'COMPACT', exact: false }).first()).toBeVisible();
});

test('system theme follows media changes without a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/settings/appearance');
    await choose(page, 'Color scheme', 'System');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
    await expect(page.getByRole('radio', { name: 'System', exact: true })).toBeChecked();
});

test('preferences synchronize between tabs and reset restores central defaults', async ({ page, context }) => {
    await page.goto('/settings/appearance');
    const other = await context.newPage();
    await other.goto('/settings/appearance');
    await choose(page, 'Accent color', 'Rose');
    await expect(other.locator('html')).toHaveAttribute('data-accent', 'rose');
    await other.getByRole('button', { name: 'Reset defaults' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', defaultTheme.accent);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)).toBeNull();
});

test('stored dark theme applies before the React runtime loads', async ({ page }) => {
    await page.addInitScript(({ key, theme }) => localStorage.setItem(key, JSON.stringify({ version: 1, settings: theme })), {
        key: THEME_STORAGE_KEY,
        theme: { ...defaultTheme, mode: 'dark', direction: 'rtl', accent: 'violet' },
    });
    await page.route(/\/_next\/.*\.js(?:\?|$)/, (route) => route.abort());
    await page.goto('/settings/appearance', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(6, 8, 24)');
    expect(await page.locator('html').evaluate((element) => (element as HTMLElement).style.getPropertyValue('--accent'))).toBe('#805dca');
});

test('corrupt or unavailable storage never blanks the workspace', async ({ page }) => {
    await page.addInitScript((key) => localStorage.setItem(key, 'not valid json'), THEME_STORAGE_KEY);
    await page.goto('/settings/appearance');
    await expect(page.getByRole('heading', { name: 'Appearance', exact: true })).toBeVisible();
    await choose(page, 'Color scheme', 'Dark');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
});

test('storage restrictions keep in-memory theme changes usable', async ({ page }) => {
    await page.addInitScript(() => {
        Storage.prototype.getItem = () => {
            throw new DOMException('Blocked', 'SecurityError');
        };
        Storage.prototype.setItem = () => {
            throw new DOMException('Blocked', 'SecurityError');
        };
        Storage.prototype.removeItem = () => {
            throw new DOMException('Blocked', 'SecurityError');
        };
    });
    await page.goto('/settings/appearance');
    await choose(page, 'Color scheme', 'Dark');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
    await expect(page.getByText('Browser storage is unavailable.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Reset defaults' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'light');
});

test('theme drawer traps focus, updates global preferences and closes on Escape', async ({ page }) => {
    await page.goto('/settings/appearance');
    const launcher = page.getByRole('button', { name: 'Customize theme' });
    await launcher.click();
    const dialog = page.getByRole('dialog', { name: 'Theme preferences' });
    await expect(dialog).toBeVisible();
    await dialog.getByText('Dark', { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
    for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(launcher).toBeFocused();
});

test('page search works with keyboard and shows meaningful empty results', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Find a page' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Find a page' }).fill('nothing-here');
    await expect(dialog.getByText('No pages found.', { exact: false })).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Find a page' }).fill('Appearance');
    await dialog.getByRole('link', { name: 'Appearance' }).click();
    await expect(page).toHaveURL(/settings\/appearance/);
    await expect(dialog).not.toBeVisible();
});

test('theme profiles export and import through real browser controls', async ({ page }) => {
    await page.goto('/settings/appearance');
    await choose(page, 'Accent color', 'Violet');
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export theme' }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe('foundation-theme.json');
    await page.getByRole('button', { name: 'Reset defaults' }).click();
    await page
        .getByLabel('Import theme file', { exact: true })
        .setInputFiles({ name: 'theme.json', mimeType: 'application/json', buffer: Buffer.from(exportTheme({ ...defaultTheme, accent: 'violet' })) });
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'violet');
    await expect(page.getByRole('status').filter({ hasText: 'Theme imported.' })).toBeVisible();
    await page.getByLabel('Import theme file', { exact: true }).setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
    await expect(page.getByRole('alert').filter({ hasText: 'Choose a theme file' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'violet');
});

test('horizontal navigation and boxed layout stay functional', async ({ page }) => {
    await page.goto('/settings/appearance');
    await choose(page, 'Navigation', 'Horizontal');
    await choose(page, 'Content width', 'Boxed');
    await expect(page.getByRole('navigation', { name: 'Horizontal navigation' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Horizontal navigation' }).getByRole('link', { name: 'UI foundations' }).click();
    await expect(page).toHaveURL(/ui-kit/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('mobile navigation, RTL and theme controls fit narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/settings/appearance');
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const dialog = page.getByRole('dialog', { name: 'Navigation', exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('link', { name: 'UI foundations' }).click();
    await expect(dialog).not.toBeVisible();
    await page.goto('/settings/appearance');
    await choose(page, 'Reading direction', 'Right to left');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Customize theme' }).click();
    await expect(page.getByRole('dialog', { name: 'Theme preferences' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Customize theme' })).toBeFocused();
    await page.getByRole('button', { name: 'Customize theme' }).evaluate((element) => (element as HTMLElement).blur());
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'test-results/appearance-mobile-rtl.png', fullPage: true });
});

test('workspace has no horizontal overflow from 320px mobile through desktop', async ({ page }) => {
    for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/settings/appearance');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
});

test('reduced motion preference is reflected in computed interaction styles', async ({ page }) => {
    await page.goto('/settings/appearance');
    await choose(page, 'Motion', 'Reduce motion');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    const duration = await page.getByRole('button', { name: 'Reset defaults' }).evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(parseFloat(duration)).toBeLessThan(0.001);
});

test('visual review captures the light and dark appearance workspaces', async ({ page }) => {
    await page.goto('/settings/appearance');
    await page.screenshot({ path: 'test-results/appearance-light.png', fullPage: true });
    await choose(page, 'Color scheme', 'Dark');
    await page.screenshot({ path: 'test-results/appearance-dark.png', fullPage: true });
});
