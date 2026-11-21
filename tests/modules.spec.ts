import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
const origin = 'http://127.0.0.1:3101';
async function useAdmin(context: import('@playwright/test').BrowserContext) {
    await context.addCookies(JSON.parse(process.env.TEST_ADMIN_COOKIES!));
}
async function useReader(context: import('@playwright/test').BrowserContext) {
    await context.addCookies(JSON.parse(process.env.TEST_READER_COOKIES!));
}
test('authenticated users leave the single login page for the shared dashboard', async ({ page, context }) => {
    await useAdmin(context);
    await page.goto('/login');
    await expect(page).toHaveURL(origin + '/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Roles', exact: true })).toBeVisible();
});
test('delegated role shows only permitted modules and read-only actions', async ({ page, context }) => {
    await useReader(context);
    await page.goto('/');
    await expect(page.getByRole('main').getByText('read-only-staff', { exact: true })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'Users', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Roles', exact: true })).toHaveCount(0);
    await nav.getByRole('link', { name: 'Users', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0);
    await page.goto('/roles');
    await expect(page.getByRole('heading', { name: 'Access restricted', exact: true })).toBeVisible();
});
test('server proxy rejects manual URL, body and method privilege attempts', async ({ context }) => {
    await useReader(context);
    const api = context.request;
    expect((await api.get('/api/modules/roles')).status()).toBe(403);
    expect(
        (
            await api.post('/api/modules/users', { headers: { Origin: origin }, data: { email: 'blocked@example.test', firstName: 'Blocked', lastName: 'User', password: 'No-access-password-123' } })
        ).status(),
    ).toBe(403);
    expect((await api.patch('/api/modules/users/' + randomUUID(), { headers: { Origin: origin }, data: { firstName: 'Blocked' } })).status()).toBe(403);
    expect((await api.post('/api/access/' + randomUUID(), { headers: { Origin: origin }, data: { kind: 'role', id: randomUUID(), grant: true } })).status()).toBe(403);
    expect((await api.get('/api/modules/not-a-module')).status()).toBe(404);
});
test('shared company editor creates, searches, updates and deletes real records', async ({ page, context }) => {
    await useAdmin(context);
    const name = 'Workspace ' + randomUUID().slice(0, 8);
    await page.goto('/companies');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name', { exact: true }).fill(name);
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await page.getByLabel('Search', { exact: true }).fill(name);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByRole('dialog').getByLabel('Phone', { exact: true }).fill('+923001234567');
    await page.getByRole('dialog').getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(row).toContainText('+923001234567');
    await row.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('No records found.', { exact: true })).toBeVisible();
});
test('shared role editor uses the real role catalog and cleans up', async ({ page, context }) => {
    await useAdmin(context);
    const name = 'e2e-' + randomUUID().slice(0, 8);
    await page.goto('/roles');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill(name);
    await page.getByRole('dialog').getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    const row = page.getByRole('row').filter({ hasText: name });
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByRole('dialog').getByLabel('Description', { exact: true }).fill('Read-only feature tests');
    await page.getByRole('dialog').getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(row).toContainText('Read-only feature tests');
    await row.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(row).toHaveCount(0);
});
test('managed users are created through the shared editor and can be archived', async ({ page, context }) => {
    await useAdmin(context);
    const email = 'managed-' + randomUUID().slice(0, 8) + '@example.test';
    await page.goto('/users');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Email address', { exact: true }).fill(email);
    await dialog.getByLabel('Initial password', { exact: true }).fill('Managed-test-password-123!');
    await dialog.getByLabel('First name', { exact: true }).fill('Managed');
    await dialog.getByLabel('Last name', { exact: true }).fill('Member');
    await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await page.getByLabel('Search', { exact: true }).fill(email);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: email });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(row).toHaveCount(0);
});
test('English and Urdu locale settings update shared navigation and survive reload', async ({ page, context }) => {
    await useAdmin(context);
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('ur');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ur');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'صارفین', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'آپ کی ورک اسپیس، ایک جگہ۔' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('en');
    await expect(page.getByRole('heading', { name: 'Your workspace, in perspective.' })).toBeVisible();
});
test('effective and direct grants are shown separately for a delegated user', async ({ page, context }) => {
    await useAdmin(context);
    await page.goto('/users');
    const row = page.getByRole('row').filter({ hasText: process.env.TEST_READER_EMAIL! });
    await row.getByRole('link', { name: 'Manage access', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Roles and permissions', exact: true })).toBeVisible();
    await expect(page.getByText('read-only-staff', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove direct grant', exact: true }).first()).toBeVisible();
});
