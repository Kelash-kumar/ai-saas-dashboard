import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
async function signIn(page: Page, portal: 'admin' | 'user', email: string = process.env.TEST_ADMIN_EMAIL!) {
    await page.goto('/login');
    await page.getByRole('button', { name: portal === 'admin' ? 'Login as Admin' : 'Login as User', exact: true }).click();
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(process.env.TEST_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
test('one public login offers both options and no registration links', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login as Admin', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Login as User', exact: true }).click();
    await expect(page.getByText('USER PORTAL', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /register|sign up/i })).toHaveCount(0);
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
    await page.screenshot({ path: 'test-results/unified-login.png', fullPage: true });
});
test('admin login is real, cookies are HttpOnly, and logout revokes the server session', async ({ page, context, request }) => {
    await signIn(page, 'admin');
    await expect(page).toHaveURL('http://127.0.0.1:3101/');
    await expect(page.getByText('Administrator · ' + process.env.TEST_ADMIN_EMAIL)).toBeVisible();
    const stored = await context.cookies();
    const access = stored.find((cookie) => cookie.name === 'foundation_access');
    expect(access?.httpOnly).toBe(true);
    expect(stored.find((cookie) => cookie.name === 'foundation_refresh')?.httpOnly).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toContain('foundation_');
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toMatch(/accessToken|refreshToken|csrfToken/);
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    const denied = await request.get('http://127.0.0.1:3110/api/v1/auth/me', { headers: { Authorization: 'Bearer ' + access!.value } });
    expect(denied.status()).toBe(401);
    await page.goto('/settings/appearance');
    await expect(page).toHaveURL(/\/login/);
});
test('ordinary users use the same dashboard without administrative capabilities', async ({ page, context }) => {
    await signIn(page, 'user', process.env.TEST_USER_EMAIL!);
    await expect(page).toHaveURL('http://127.0.0.1:3101/');
    await expect(page.getByRole('heading', { name: 'Your workspace, in perspective.' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Users', exact: true })).toHaveCount(0);
    await context.addCookies([{ name: 'foundation_portal', value: 'admin', url: 'http://127.0.0.1:3101', httpOnly: true, sameSite: 'Strict' }]);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Access restricted', exact: true })).toBeVisible();
});
test('an ordinary account is rejected by the admin login endpoint', async ({ page }) => {
    await signIn(page, 'admin', process.env.TEST_USER_EMAIL!);
    await expect(page.getByRole('alert').filter({ hasText: 'Invalid credentials' })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
});
test('invalid credentials show a useful error without navigating away', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Login as User', exact: true }).click();
    await page.getByLabel('Email address', { exact: true }).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel('Password', { exact: true }).fill('Not-the-right-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Invalid credentials' })).toBeVisible();
});
test('same-origin boundary rejects cross-site login and logout requests', async ({ request }) => {
    const response = await request.post('/api/session/login', {
        headers: { Origin: 'https://attacker.example' },
        data: { portal: 'admin', email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_PASSWORD },
    });
    expect(response.status()).toBe(403);
    expect((await request.post('/api/session/logout', { headers: { Origin: 'https://attacker.example' } })).status()).toBe(403);
});
test('expired access restores through one serialized rotation across browser tabs', async ({ page, context }) => {
    await signIn(page, 'admin');
    await expect(page).toHaveURL('http://127.0.0.1:3101/');
    await context.clearCookies({ name: 'foundation_access' });
    const other = await context.newPage();
    await Promise.all([page.goto('/settings/appearance'), other.goto('/settings/appearance')]);
    await expect(page).toHaveURL('http://127.0.0.1:3101/');
    await expect(other).toHaveURL('http://127.0.0.1:3101/');
    await expect(page.getByRole('heading', { name: 'Your workspace, in perspective.' })).toBeVisible();
});
test('mobile login stays readable without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await expect(page.getByLabel('Email address', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/admin-login-mobile.png', fullPage: true });
});
