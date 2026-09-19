import { randomUUID } from 'node:crypto';
import { expect, test } from './fixtures';

test.describe('authentication', () => {
	test('registers, logs out and logs back in', async ({ page }) => {
		const email = `e2e-${randomUUID()}@example.com`;
		const password = 'e2e-password-123';

		await page.goto('/register');
		await page.fill('#name', 'Smoke Tester');
		await page.fill('#email', email);
		await page.fill('#password', password);
		await page.fill('#confirmPassword', password);
		await page.getByRole('button', { name: 'Create Account' }).click();

		await expect(page).toHaveURL('/');
		const me = await page.request.get('/api/v1/me');
		expect(me.status()).toBe(200);
		expect((await me.json()).email).toBe(email);

		await page.goto('/settings');
		await page.getByRole('button', { name: 'Log out' }).first().click();
		await expect(page).toHaveURL(/\/login$/);

		await page.goto('/');
		await expect(page).toHaveURL(/\/login$/);

		await page.fill('#email', email);
		await page.fill('#password', password);
		await page.getByRole('button', { name: 'Sign In' }).click();
		await expect(page).toHaveURL('/');
		await expect(page.getByRole('tab', { name: 'Week' })).toBeVisible();
	});

	test('an unauthenticated request to a protected page redirects to the login page', async ({
		page
	}) => {
		const response = await page.request.get('/', { maxRedirects: 0 });
		expect(response.status()).toBe(302);
		expect(response.headers()['location']).toBe('/login');
	});

	test('an unauthenticated API request is rejected as JSON', async ({ page }) => {
		const response = await page.request.get('/api/v1/me');
		expect(response.status()).toBe(401);
		expect(response.headers()['x-content-type-options']).toBe('nosniff');
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
	});
});
