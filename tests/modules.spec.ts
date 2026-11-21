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

test('CRM company forms, filtered exports and archive restore use real API records', async ({ page, context }) => {
    await useAdmin(context);
    const name = 'CRM ' + randomUUID().slice(0, 8);
    await page.goto('/companies/create');
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
    await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('+923001234567');
    await page.getByRole('button', { name: /Create Record/ }).click();
    await expect(page.getByRole('heading', { name: 'View Company', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Edit', exact: true }).click();
    await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('+923009999999');
    await page.getByRole('button', { name: /Update Record/ }).click();
    await expect(page.getByRole('heading', { name: 'View Company', exact: true })).toBeVisible();
    await page.getByRole('link', { name: /Back to List/ }).click();
    await page.getByLabel('Search', { exact: true }).fill(name);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toContainText('+923009999999');
    for (const format of ['CSV', 'Excel']) {
        const download = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Export ' + format, exact: false }).click();
        const file = await download;
        expect(file.suggestedFilename()).toBe('companies.' + (format === 'CSV' ? 'csv' : 'xlsx'));
    }
    await row.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Delete (1)', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(row).toHaveCount(0);
    await expect(page.getByLabel('Include Deleted', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Show Filters', exact: true }).click();
    await page.getByLabel('Include Deleted', { exact: true }).selectOption('only');
    await page.getByRole('button', { name: /Apply Filters/ }).click();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /Actions for/ }).click();
    await page.getByRole('menuitem', { name: 'Restore', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Restore', exact: true }).click();
    await expect(row).toHaveCount(0);
    await page.getByRole('button', { name: 'Clear Filters', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible();
});
test('CRM role guard and permission matrix persist through create and edit', async ({ page, context }) => {
    await useAdmin(context);
    const name = 'crm-' + randomUUID().slice(0, 8);
    await page.goto('/roles/create');
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
    await page.getByLabel('Guard', { exact: false }).selectOption('user');
    const matrix = page.locator('.crm-matrix-row').filter({ has: page.getByText('Users Management', { exact: true }) });
    await matrix.getByRole('checkbox', { name: 'Read', exact: true }).check();
    await page.getByRole('button', { name: /Create Record/ }).click();
    await expect(page.getByRole('heading', { name: 'View Role', exact: true })).toBeVisible();
    await expect(
        page
            .locator('.crm-matrix-row')
            .filter({ has: page.getByText('Users Management', { exact: true }) })
            .getByRole('checkbox', { name: 'Read', exact: true }),
    ).toBeChecked();
    await page.getByRole('link', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Description', { exact: true }).fill('Reference matrix editor');
    await page.getByRole('button', { name: /Update Record/ }).click();
    await expect(page.getByRole('heading', { name: 'View Role', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page).toHaveURL(origin + '/roles');
});
test('managed users use full page forms with profile and email preferences', async ({ page, context }) => {
    await useAdmin(context);
    const email = 'crm-' + randomUUID().slice(0, 8) + '@example.test';
    await page.goto('/users/create');
    await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('Managed');
    await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill('Member');
    await page.getByRole('textbox', { name: 'Username', exact: true }).fill('u.' + randomUUID().slice(0, 8));
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
    await page.locator('[name=password]').fill('Managed-password-123!');
    await page.locator('[name=confirmPassword]').fill('Managed-password-123!');
    await page.getByLabel('Date of Birth', { exact: true }).fill('1995-01-01');
    await page.getByLabel('Gender', { exact: true }).selectOption('male');
    await page.getByLabel('Notification', { exact: true }).selectOption('email');
    await page.getByRole('button', { name: /Create Record/ }).click();
    await expect(page.getByRole('heading', { name: 'View User', exact: true })).toBeVisible();
    await expect(page.getByLabel('Notification', { exact: true })).toHaveValue('email');
    const role = await context.request.post('/api/crm/roles', { headers: { Origin: origin }, data: { name: 'reader-' + randomUUID().slice(0, 8), guard: 'user', permissionIds: [] } });
    expect(role.ok()).toBe(true);
    const roleId = (await role.json()).data.id;
    const userId = page.url().split('/').pop()!;
    expect((await context.request.patch('/api/crm/users/' + userId, { headers: { Origin: origin }, data: { roleIds: [roleId] } })).ok()).toBe(true);
    const memberContext = await context.browser()!.newContext();
    const member = await memberContext.newPage();
    try {
        await member.goto(origin + '/login?as=user');
        await member.getByLabel('Email address', { exact: true }).fill(email);
        await member.getByLabel('Password', { exact: true }).fill('Managed-password-123!');
        await member.getByRole('button', { name: 'Sign in', exact: true }).click();
        await expect(member).toHaveURL(origin + '/');
        await expect(member.getByRole('heading', { name: 'Your workspace, in perspective.' })).toBeVisible();
        await expect(member.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Admins', exact: true })).toHaveCount(0);
    } finally {
        await memberContext.close();
    }

    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page).toHaveURL(origin + '/users');
});
test('admin page mirrors the reference fields and submits a separate account type', async ({ page, context }) => {
    await useAdmin(context);
    await page.goto('/admins/create');
    await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('Reference');
    await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill('Admin');
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('admin-' + randomUUID().slice(0, 8) + '@example.test');
    await page.locator('[name=password]').fill('Reference-password-123!');
    await page.locator('[name=confirmPassword]').fill('Reference-password-123!');
    await page.getByLabel('Two-Factor', { exact: true }).selectOption('email');
    await page.screenshot({ path: 'test-results/crm-create-admin.png', fullPage: true });
    await page.getByRole('button', { name: /Create Record/ }).click();
    await expect(page.getByRole('heading', { name: 'View Admin', exact: true })).toBeVisible();
    await expect(page.getByLabel('Two-Factor', { exact: true })).toHaveValue('email');
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page).toHaveURL(origin + '/admins');
});
test('CRM rejects unauthorized exports, admin routes, writes and cross-origin changes', async ({ page, context }) => {
    await useReader(context);
    await page.goto('/admins');
    await expect(page.getByRole('heading', { name: 'Access restricted', exact: true })).toBeVisible();
    expect((await context.request.get('/api/crm/admins')).status()).toBe(403);
    expect((await context.request.get('/api/crm/users/export?format=csv')).status()).toBe(403);
    expect((await context.request.post('/api/crm/users/bulk', { headers: { Origin: origin }, data: { ids: [randomUUID()], action: 'delete' } })).status()).toBe(403);
    expect((await context.request.post('/api/crm/users', { headers: { Origin: 'https://evil.example' }, data: {} })).status()).toBe(403);
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
    await row.getByRole('button', { name: /Actions for/ }).click();
    await page.getByRole('menuitem', { name: 'Manage access', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Roles and permissions', exact: true })).toBeVisible();
    await expect(page.getByText('read-only-staff', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove direct grant', exact: true }).first()).toBeVisible();
});
