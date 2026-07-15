import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/roundtrip.test.ts'],
    testTimeout: 10_000,
    browser: {
      enabled: true,
      headless: process.env.DEBUG !== '1',
      ui: process.env.DEBUG === '1',
      provider: playwright(),
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
    },
  },
});
