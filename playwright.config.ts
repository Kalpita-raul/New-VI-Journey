import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env.UAT_URL ??
  'https://vaninsurance-journey-live-0b448a13974f.herokuapp.com';

export default defineConfig({
  testDir: './tests',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  actionTimeout: 20_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
