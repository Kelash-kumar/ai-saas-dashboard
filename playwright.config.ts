import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
    testDir: './tests',
    globalSetup: './tests/global-setup.ts',
    fullyParallel: false,
    workers: 1,
    timeout: 30000,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: { baseURL: 'http://127.0.0.1:3101', trace: 'retain-on-failure', screenshot: 'only-on-failure', ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    webServer: {
        command: 'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3101',
        url: 'http://127.0.0.1:3101',
        reuseExistingServer: false,
        timeout: 60000,
        env: { APP_ORIGIN: 'http://127.0.0.1:3101', API_BASE_URL: 'http://127.0.0.1:3110/api/v1', API_REFRESH_COOKIE_NAME: 'foundation_refresh' },
    },
});
