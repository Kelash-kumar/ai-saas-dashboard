import { expect, test } from '@playwright/test';
import { createLoadingStore } from '../lib/loading/loading-store';

test('loading tokens preserve concurrent tasks and tolerate repeated cleanup', () => {
    const store = createLoadingStore();
    const first = store.start('First task');
    const second = store.start('Second task');
    expect(store.getSnapshot()).toEqual({ pendingCount: 2, message: 'Second task' });
    second();
    second();
    expect(store.getSnapshot()).toEqual({ pendingCount: 1, message: 'First task' });
    expect(store.getServerSnapshot().pendingCount).toBe(0);
    first();
    expect(store.getSnapshot().pendingCount).toBe(0);
});

test('tracked tasks preserve return values and release on rejection or cancellation', async () => {
    const store = createLoadingStore();
    expect(await store.run(async () => 42)).toBe(42);
    await expect(
        store.run(async () => {
            throw new Error('Request failed');
        }),
    ).rejects.toThrow('Request failed');
    expect(store.getSnapshot().pendingCount).toBe(0);
    const controller = new AbortController();
    const request = store.run(() => new Promise<void>((_, reject) => controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true })));
    expect(store.getSnapshot().pendingCount).toBe(1);
    controller.abort();
    await expect(request).rejects.toThrow();
    expect(store.getSnapshot().pendingCount).toBe(0);
});

test('custom actions show the global loader and restore the workspace', async ({ page, context }) => {
    await context.addCookies(JSON.parse(process.env.TEST_ADMIN_COOKIES!));
    await page.goto('/ui-kit');
    await expect(page.getByRole('status').filter({ hasText: 'Loading details…' })).toBeVisible();
    await page.getByRole('button', { name: 'Preview global loader', exact: true }).click();
    const overlay = page.locator('.app-loader--fullscreen');
    await expect(overlay).toHaveText('Loading your workspace…');
    await expect(overlay).toHaveCSS('opacity', '1');
    await page.screenshot({ path: 'test-results/global-loader-preview.png', fullPage: true });
    await expect(overlay).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Preview global loader', exact: true })).toBeEnabled();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => {
        document.documentElement.dataset.mode = 'dark';
    });
    await page.getByRole('button', { name: 'Preview global loader', exact: true }).click();
    await expect(overlay.locator('.app-loader-spinner')).toHaveCSS('animation-name', 'none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/global-loader-mobile-dark.png' });
    await expect(overlay).toHaveCount(0);
});

test('automatic API loading clears after a service error', async ({ page }) => {
    const release = Promise.withResolvers<void>();
    await page.route('**/api/session/login', async (route) => {
        await release.promise;
        await route.fulfill({ status: 503, json: { message: 'Please try again shortly.' } });
    });
    await page.goto('/login');
    await page.getByLabel('Email address', { exact: true }).fill('loader@example.test');
    await page.getByLabel('Password', { exact: true }).fill('Loader-password-123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    try {
        await expect(page.locator('.app-loader--fullscreen')).toHaveCSS('opacity', '1');
        await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0);
    } finally {
        release.resolve();
    }
    await expect(page.getByRole('alert').filter({ hasText: 'Please try again shortly.' })).toBeVisible();
    await expect(page.locator('.app-loader--fullscreen')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
});

test('CRM transitions show loading and background company lookups stay quiet', async ({ page, context }) => {
    await context.addCookies(JSON.parse(process.env.TEST_ADMIN_COOKIES!));
    await page.goto('/users');
    const background = Promise.withResolvers<void>();
    const started = Promise.withResolvers<void>();
    await page.route('**/api/crm/companies?*', async (route) => {
        started.resolve();
        await background.promise;
        await route.continue();
    });
    await page.getByRole('button', { name: 'Show Filters', exact: true }).click();
    try {
        await started.promise;
        await expect(page.locator('.app-loader--fullscreen')).toHaveCount(0);
    } finally {
        background.resolve();
    }
    const navigation = Promise.withResolvers<void>();
    await page.route('**/users?*', async (route) => {
        await navigation.promise;
        await route.continue();
    });
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('no-matching-loader-user');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    try {
        await expect(page.locator('.app-loader--fullscreen')).toHaveCSS('opacity', '1');
    } finally {
        navigation.resolve();
    }
    await expect(page).toHaveURL(/search=no-matching-loader-user/);
    await expect(page.locator('.app-loader--fullscreen')).toHaveCount(0);
    await expect(page.getByText('No records found.', { exact: true })).toBeVisible();
});
