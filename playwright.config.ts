import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4300);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? [['github'], ['list']] : [['list']],
	timeout: 60_000,
	expect: { timeout: 15_000 },
	use: {
		baseURL,
		// The UI is translated with paraglide; pin the browser to English so tests can
		// address elements by their accessible name.
		locale: 'en-US',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		// e2e/server.mjs starts Postgres, migrates and runs the adapter-node build; run
		// `pnpm build` first (or use `pnpm test:e2e`, which builds).
		command: 'node e2e/server.mjs',
		url: `${baseURL}/healthz`,
		env: { PORT: String(PORT) },
		timeout: 180_000,
		reuseExistingServer: !process.env.CI,
		stdout: 'ignore',
		stderr: 'pipe'
	}
});
