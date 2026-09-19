/**
 * Captures the README screenshots from a running instance with seed data.
 *
 *   pnpm db:seed && pnpm dev
 *   pnpm screenshots            # or BASE_URL=http://localhost:3000 pnpm screenshots
 *
 * Writes PNGs to assets/screens/.
 */
import { chromium, type Browser, type Page } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT_DIR = 'assets/screens';

type Shot = { name: string; path: string; fullPage?: boolean };

const DESKTOP_SHOTS: Shot[] = [
	{ name: 'diary', path: '/' },
	{ name: 'meals', path: '/meals' },
	{ name: 'analytics', path: '/analytics' },
	{ name: 'settings', path: '/settings' }
];

const MOBILE_SHOTS: Shot[] = [
	{ name: 'mobile-diary', path: '/' },
	{ name: 'mobile-meals', path: '/meals' },
	{ name: 'mobile-analytics', path: '/analytics' }
];

async function newPage(
	browser: Browser,
	viewport: { width: number; height: number },
	mode: 'light' | 'dark'
): Promise<Page> {
	const context = await browser.newContext({
		viewport,
		deviceScaleFactor: 2,
		colorScheme: mode,
		locale: 'de-DE'
	});
	await context.addCookies([{ name: 'PARAGLIDE_LOCALE', value: 'de', url: BASE_URL }]);
	await context.addInitScript((m) => localStorage.setItem('mode-watcher-mode', m), mode);
	const page = await context.newPage();
	await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
	await page.fill('#email', 'demo@example.com');
	await page.fill('#password', 'demo1234');
	await page.click('button[type="submit"]');
	await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'networkidle' });
	// Sign-in redirects via both better-auth's callbackURL and goto('/'); let the second one land.
	await page.waitForTimeout(1000);
	return page;
}

async function capture(page: Page, shots: Shot[], suffix = '') {
	for (const shot of shots) {
		await page.goto(`${BASE_URL}${shot.path}`, { waitUntil: 'networkidle' });
		// Charts and entry animations settle after network idle.
		await page.waitForTimeout(1200);
		const file = `${OUT_DIR}/${shot.name}${suffix}.png`;
		await page.screenshot({ path: file, fullPage: shot.fullPage });
		console.log(`wrote ${file}`);
	}
}

const browser = await chromium.launch();
await mkdir(OUT_DIR, { recursive: true });
try {
	await capture(await newPage(browser, { width: 1440, height: 900 }, 'light'), DESKTOP_SHOTS);
	await capture(
		await newPage(browser, { width: 1440, height: 900 }, 'dark'),
		DESKTOP_SHOTS.slice(0, 1),
		'-dark'
	);
	await capture(await newPage(browser, { width: 390, height: 844 }, 'light'), MOBILE_SHOTS);
} finally {
	await browser.close();
}
