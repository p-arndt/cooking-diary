import { randomUUID } from 'node:crypto';
import { expect, test, withOtherUser } from './fixtures';
import { pngFile } from './png';

const suffix = () => randomUUID().slice(0, 8);

test.describe('ownership', () => {
	test('another account cannot reach a meal, its photo or an entry it does not own', async ({
		page,
		api,
		browser,
		baseURL
	}) => {
		const title = `E2E Private Meal ${suffix()}`;

		await page.goto('/meals/new');
		await page.fill('#title', title);
		await page.setInputFiles('#photo', pngFile('private.png', 24, 24));
		await expect(page.locator('img[src^="data:image/png"]')).toBeVisible();
		await page.getByRole('button', { name: 'Save Meal' }).click();
		await expect(page).toHaveURL(/\/meals\/[0-9a-f-]{36}$/);
		const mealId = page.url().split('/').pop()!;

		const [meal] = await api.meals(title);
		const photoUrl = meal.defaultPhotoUrl!;
		const entry = await api.createEntry({
			mealId,
			dateCooked: new Date().toISOString().slice(0, 10),
			notes: `private entry ${suffix()}`
		});

		await withOtherUser(browser, baseURL!, async (intruder) => {
			expect((await intruder.goto(`/meals/${mealId}`))!.status()).toBe(404);
			expect(await intruder.content()).not.toContain(title);
			expect((await intruder.goto(`/meals/${mealId}/edit`))!.status()).toBe(404);
			expect((await intruder.request.get(`/api/v1/meals/${mealId}`)).status()).toBe(404);

			expect((await intruder.request.get(photoUrl)).status()).toBe(404);
			const decodedWidth = await intruder.evaluate(async (src) => {
				const image = new Image();
				image.src = src;
				await new Promise((resolve) => {
					image.onload = resolve;
					image.onerror = resolve;
				});
				return image.naturalWidth;
			}, photoUrl);
			expect(decodedWidth).toBe(0);

			const patched = await intruder.request.patch('/api/entries', {
				data: { id: entry.id, notes: 'hijacked' },
				headers: { Origin: baseURL! }
			});
			const deleted = await intruder.request.delete('/api/entries', {
				data: { id: entry.id },
				headers: { Origin: baseURL! }
			});
			expect([patched.status(), deleted.status()]).toEqual([404, 404]);
		});

		// The owner's entry is untouched.
		const stillThere = (await api.entries()).find((e) => e.id === entry.id);
		expect(stillThere?.notes).toBe(entry.notes);
	});
});

test.describe('security headers', () => {
	test('serves a nonce based CSP and the hardening headers on an HTML page', async ({ page }) => {
		const response = await page.request.get('/login');
		expect(response.status()).toBe(200);

		const headers = response.headers();
		const csp = headers['content-security-policy'];
		expect(csp).toMatch(/script-src[^;]*'nonce-[^']+'/);
		expect(headers['x-frame-options']).toBe('DENY');
		expect(headers['x-content-type-options']).toBe('nosniff');
		expect(headers['referrer-policy']).toBeTruthy();

		const html = await response.text();
		const nonce = csp.match(/'nonce-([^']+)'/)![1];
		expect(html).toContain(`nonce="${nonce}"`);
		// The placeholder must never survive into the response.
		expect(html).not.toContain('%csp.nonce%');
		const inlineScripts = html.match(/<script(?![^>]*\ssrc=)[^>]*>/g) ?? [];
		expect(inlineScripts.every((tag) => tag.includes('nonce="'))).toBe(true);
	});

	test('answers /healthz without authentication', async ({ page }) => {
		const response = await page.request.get('/healthz');
		expect(response.status()).toBe(200);
		expect(await response.json()).toEqual({ status: 'ok' });
	});
});
