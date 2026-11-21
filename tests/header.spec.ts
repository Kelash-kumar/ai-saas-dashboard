import { expect, test } from '@playwright/test';
test('profile menu shows the real account and replaces removed sidebar content', async ({ page, context }) => {
    await context.addCookies(JSON.parse(process.env.TEST_ADMIN_COOKIES!));
    await page.goto('/');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar.getByRole('link', { name: 'My account', exact: true })).toHaveCount(0);
    await expect(sidebar.getByText('Built around you', { exact: true })).toHaveCount(0);
    await expect(sidebar.getByText('Foundation', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Open account menu', exact: true }).click();
    await expect(page.getByText('System Administrator', { exact: true })).toBeVisible();
    await expect(page.getByRole('menu').getByText(process.env.TEST_ADMIN_EMAIL!, { exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/header-profile-dropdown.png', fullPage: true });
    await page.getByRole('menuitem', { name: 'Profile', exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
});
test('clear cache refreshes workspace data while preserving session and preferences', async ({ page, context }) => {
    await context.addCookies(JSON.parse(process.env.TEST_ADMIN_COOKIES!));
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
    await page.evaluate(async () => {
        await (await caches.open('foundation-header-test')).put('/test', new Response('stale'));
        await (await caches.open('unrelated-header-test')).put('/test', new Response('other'));
    });
    await page.getByRole('button', { name: 'Open account menu', exact: true }).click();
    await Promise.all([page.waitForEvent('load'), page.getByRole('menuitem', { name: 'Clear Cache', exact: true }).click()]);
    await expect(page.getByRole('heading', { name: 'Your workspace, in perspective.' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
    expect(await page.evaluate(() => caches.has('foundation-header-test'))).toBe(false);
    expect(await page.evaluate(() => caches.has('unrelated-header-test'))).toBe(true);
});
test('lock screen revokes the current session and manual protected URLs require login', async ({ page, context, request }) => {
    await page.goto('/login');
    await page.getByLabel('Email address', { exact: true }).fill(process.env.TEST_ADMIN_EMAIL!);
    await page.getByLabel('Password', { exact: true }).fill(process.env.TEST_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('http://127.0.0.1:3101/');
    const access = (await context.cookies()).find((cookie) => cookie.name === 'foundation_access')?.value;
    await page.getByRole('button', { name: 'Open account menu', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Lock Screen', exact: true }).click();
    await expect(page).toHaveURL(/\/login\?reason=locked$/);
    await expect(page.getByRole('heading', { name: 'Workspace locked', exact: true })).toBeVisible();
    expect((await request.get('http://127.0.0.1:3110/api/v1/auth/me', { headers: { Authorization: 'Bearer ' + access } })).status()).toBe(401);
    await page.goto('/admins');
    await expect(page).toHaveURL(/\/login/);
});
