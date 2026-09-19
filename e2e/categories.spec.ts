import { randomUUID } from 'node:crypto';
import { expect, test } from './fixtures';

test.describe('categories', () => {
	test('creates, renames and deletes a category without a manual reload', async ({
		page,
		user
	}) => {
		void user;
		const name = `E2E Cat ${randomUUID().slice(0, 8)}`;
		const renamed = `${name} Renamed`;

		await page.goto('/categories');

		await page.getByRole('button', { name: 'Add Category' }).first().click();
		const dialog = page.getByRole('dialog');
		await dialog.getByLabel('Category Name').fill(name);
		await dialog.getByRole('button', { name: 'Add', exact: true }).click();

		await expect(dialog).toBeHidden();
		await expect(page.getByText(name, { exact: true })).toBeVisible();

		const card = page
			.locator('div.rounded-3xl')
			.filter({ has: page.getByText(name, { exact: true }) })
			.last();
		await card.getByRole('button', { name: 'Edit' }).click();
		await page.locator('form[action="?/edit"] input').fill(renamed);
		await page.locator('form[action="?/edit"] button[type="submit"]').click();

		await expect(page.getByText(renamed, { exact: true })).toBeVisible();
		await expect(page.getByText(name, { exact: true })).toHaveCount(0);

		await page.reload();
		await expect(page.getByText(renamed, { exact: true })).toBeVisible();

		await page
			.locator('div.rounded-3xl')
			.filter({ has: page.getByText(renamed, { exact: true }) })
			.last()
			.getByRole('button', { name: 'Delete' })
			.click();
		const confirm = page.getByRole('alertdialog');
		await confirm.locator('form button[type="submit"]').last().click();

		await expect(page.getByText(renamed, { exact: true })).toHaveCount(0);
		await page.reload();
		await expect(page.getByText(renamed, { exact: true })).toHaveCount(0);
	});
});
