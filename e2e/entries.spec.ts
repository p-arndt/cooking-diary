import { randomUUID } from 'node:crypto';
import { expect, test, type ApiClient } from './fixtures';
import { pngFile } from './png';

const suffix = () => randomUUID().slice(0, 8);

async function seedMeal(api: ApiClient) {
	return api.createMeal({ title: `E2E Diary Meal ${suffix()}` });
}

test.describe('entries', () => {
	test('adds an entry with a photo through the three step wizard', async ({ page, api }) => {
		const meal = await seedMeal(api);
		const notes = `three step ${suffix()}`;

		await page.goto('/entries/add');
		await page.getByRole('button', { name: 'Today', exact: true }).click();
		await page.getByRole('button', { name: 'Next' }).click();
		await expect(page).toHaveURL(/step=2/);

		await page.fill('#search', meal.title);
		await page
			.getByRole('button', { name: new RegExp(meal.title) })
			.first()
			.click();
		await expect(page).toHaveURL(/step=3/);

		await page.fill('#notes', notes);
		await page.setInputFiles('#photos', pngFile('entry.png', 30, 30, [120, 40, 200]));
		await expect(page.locator('img[src^="data:image/png"]')).toBeVisible();
		await page.getByRole('button', { name: 'Save Entry' }).click();

		await expect(page).toHaveURL('/');
		await expect
			.poll(async () => (await api.entries()).find((e) => e.notes === notes)?.photoUrls?.length)
			.toBe(1);

		const card = page.locator('div.group').filter({ hasText: notes }).first();
		await expect(card).toBeVisible();
		await expect
			.poll(() =>
				card
					.locator('img')
					.first()
					.evaluate((img: HTMLImageElement) => (img.complete ? img.naturalWidth : 0))
			)
			.toBeGreaterThan(0);
	});

	test('adds, edits and deletes an entry through the quick add dialog', async ({ page, api }) => {
		const meal = await seedMeal(api);
		const notes = `quick add ${suffix()}`;

		await page.goto('/');
		await page.getByRole('button', { name: 'Add Entry' }).last().click();
		const dialog = page.getByRole('dialog');
		await dialog.getByPlaceholder('Search meals...').fill(meal.title);
		await dialog
			.getByRole('button', { name: new RegExp(meal.title) })
			.first()
			.click();
		await dialog.getByText('Optional fields').click();
		await dialog.locator('#notes').fill(notes);
		await dialog.locator('input[type="file"]').setInputFiles(pngFile('quick.png', 20, 20));
		await expect(dialog.locator('img[src^="data:image/png"]')).toBeVisible();
		await dialog.getByRole('button', { name: 'Add Entry' }).click();

		await expect(dialog).toBeHidden();
		await expect(page.getByText(notes).first()).toBeVisible();

		const created = (await api.entries()).find((e) => e.notes === notes);
		expect(created?.photoUrls).toHaveLength(1);
		const photoUrl = created!.photoUrls![0];

		// Editing the notes must leave the already-uploaded photo alone.
		const card = page.locator('div.group').filter({ hasText: notes }).first();
		await card.getByRole('button', { name: 'Edit' }).click();
		await page.getByRole('menuitem', { name: 'Edit' }).click();
		const editDialog = page.getByRole('dialog');
		await expect(editDialog.getByText('Edit Entry')).toBeVisible();
		await editDialog.getByText('Optional fields').click();
		await editDialog.locator('#notes').fill(`${notes} edited`);
		await editDialog.getByRole('button', { name: 'Save', exact: true }).click();

		await expect(editDialog).toBeHidden();
		await expect(page.getByText(`${notes} edited`).first()).toBeVisible();
		expect((await api.entries()).find((e) => e.id === created!.id)?.photoUrls).toEqual([photoUrl]);

		// Deleting the entry takes its photo with it.
		const editedCard = page
			.locator('div.group')
			.filter({ hasText: `${notes} edited` })
			.first();
		await editedCard.getByRole('button', { name: 'Edit' }).click();
		await page.getByRole('menuitem', { name: 'Delete' }).click();
		await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();

		await expect(page.getByText(`${notes} edited`)).toHaveCount(0);
		expect((await page.request.get(photoUrl)).status()).toBe(404);
	});

	test('the timeline loads more entries while scrolling', async ({ page, api }) => {
		const meal = await seedMeal(api);
		const day = new Date();
		for (let i = 0; i < 30; i++) {
			day.setDate(day.getDate() - 1);
			await api.createEntry({
				mealId: meal.id,
				dateCooked: day.toISOString().slice(0, 10),
				notes: `timeline ${i}`
			});
		}

		await page.goto('/?view=timeline');
		const cards = page.locator('div.group');
		await expect(cards.first()).toBeVisible();
		const before = await cards.count();

		const loadMore = page.waitForResponse((r) => r.url().includes('/api/entries?offset='));
		await expect
			.poll(async () => {
				await page.mouse.wheel(0, 4000);
				return cards.count();
			})
			.toBeGreaterThan(before);
		expect((await loadMore).status()).toBe(200);
	});
});
