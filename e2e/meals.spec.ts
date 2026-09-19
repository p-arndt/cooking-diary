import { randomUUID } from 'node:crypto';
import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures';
import { pngFile } from './png';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const suffix = () => randomUUID().slice(0, 8);

/** Waits until the browser has actually decoded the image, then returns its src. */
async function renderedPhotoSrc(image: Locator) {
	await image.scrollIntoViewIfNeeded();
	await expect
		.poll(() => image.evaluate((img: HTMLImageElement) => (img.complete ? img.naturalWidth : 0)))
		.toBeGreaterThan(0);
	return image.getAttribute('src');
}

test.describe('meals', () => {
	test('creates a meal with a category and a photo, then replaces the photo', async ({
		page,
		user
	}) => {
		void user;
		const title = `E2E Meal ${suffix()}`;
		const editedTitle = `${title} edited`;
		const category = `E2E Cat ${suffix()}`;

		await page.goto('/meals/new');
		await page.fill('#title', title);

		// Typing a category that does not exist yet creates it inline and attaches it.
		const categoryInput = page.getByPlaceholder('Type to add categories', { exact: false });
		await categoryInput.fill(category);
		await categoryInput.press('Enter');
		await expect(page.locator('[data-slot="badge"]').filter({ hasText: category })).toBeVisible();

		await page.setInputFiles('#photo', pngFile('meal.png', 64, 48, [220, 60, 30]));
		await expect(page.locator('img[src^="data:image/png"]')).toBeVisible();
		await page.getByRole('button', { name: 'Save Meal' }).click();

		await expect(page).toHaveURL(new RegExp(`/meals/${UUID}$`));
		const mealId = page.url().split('/').pop()!;
		await expect(page.getByRole('heading', { name: title })).toBeVisible();
		await expect(page.getByText(category, { exact: true }).first()).toBeVisible();

		const firstPhoto = await renderedPhotoSrc(page.locator(`img[alt="${title}"]`));
		expect(firstPhoto).toMatch(/^\/files\//);

		// The uploaded file is served back as a real, non-sniffable image.
		const served = await page.request.get(firstPhoto!);
		expect(served.status()).toBe(200);
		expect(served.headers()['content-type']).toBe('image/png');
		expect(served.headers()['x-content-type-options']).toBe('nosniff');

		await page.goto(`/meals/${mealId}/edit`);
		await page.fill('#title', editedTitle);
		await page.setInputFiles('#photo', pngFile('meal2.png', 40, 40, [30, 160, 60]));
		await expect(page.locator('img[src^="data:image/png"]')).toBeVisible();
		await page.getByRole('button', { name: 'Save Changes' }).click();

		await expect(page).toHaveURL(new RegExp(`/meals/${mealId}$`));
		await expect(page.getByRole('heading', { name: editedTitle })).toBeVisible();
		const secondPhoto = await renderedPhotoSrc(page.locator(`img[alt="${editedTitle}"]`));
		expect(secondPhoto).not.toBe(firstPhoto);

		// The replaced photo is removed from storage instead of being orphaned.
		expect((await page.request.get(firstPhoto!)).status()).toBe(404);

		// Editing another field must not disturb the photo.
		await page.goto(`/meals/${mealId}/edit`);
		await page.fill('#prepTime', '12 min');
		await page.getByRole('button', { name: 'Save Changes' }).click();
		await expect(page).toHaveURL(new RegExp(`/meals/${mealId}$`));
		expect(await renderedPhotoSrc(page.locator(`img[alt="${editedTitle}"]`))).toBe(secondPhoto);
	});

	test('rejects a non-image file that claims to be a PNG', async ({ page, api }) => {
		const title = `E2E Bad Upload ${suffix()}`;
		const alerts: string[] = [];
		page.on('dialog', async (dialog) => {
			alerts.push(dialog.message());
			await dialog.accept();
		});

		await page.goto('/meals/new');
		await page.fill('#title', title);
		await page.setInputFiles('#photo', {
			name: 'fake.png',
			mimeType: 'image/png',
			buffer: Buffer.from('this is definitely not an image\n')
		});
		await page.getByRole('button', { name: 'Save Meal' }).click();

		await expect.poll(() => alerts.join(' | ')).toMatch(/invalid file type/i);
		await expect(page).toHaveURL(/\/meals\/new$/);
		expect(await api.meals(title)).toHaveLength(0);
	});

	test('filters the meal library by search term and by category', async ({ page, api }) => {
		const pasta = await api.createCategory(`Pasta ${suffix()}`);
		const soup = await api.createCategory(`Soup ${suffix()}`);
		const carbonara = `Spaghetti Carbonara ${suffix()}`;
		await api.createMeal({ title: carbonara, categoryIds: [pasta.id] });
		await api.createMeal({ title: `Lasagne ${suffix()}`, categoryIds: [pasta.id] });
		await api.createMeal({ title: `Tomato Soup ${suffix()}`, categoryIds: [soup.id] });

		const mealLinks = page.locator('a[href^="/meals/"]:not([href="/meals/new"])');
		await page.goto('/meals');
		await expect(mealLinks).toHaveCount(3);

		await page.getByPlaceholder('Search meals...').fill('Spaghetti');
		await expect(page).toHaveURL(/search=Spaghetti/);
		await expect(mealLinks).toHaveCount(1);
		await expect(mealLinks.first()).toContainText(carbonara);

		await page.goto('/meals');
		await page.getByRole('button', { name: 'All Categories' }).click();
		await page.getByRole('button', { name: pasta.name, exact: true }).click();
		await expect(page).toHaveURL(/category=/);
		await expect(mealLinks).toHaveCount(2);
	});
});
