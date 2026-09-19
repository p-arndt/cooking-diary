import { existsSync } from 'fs';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/server/db';
import { mealEntries, meals } from '$lib/server/db/schema';
import { createEntry, createMeal, createUser } from '$lib/server/test/factories';
import { FileService } from './file.service';

let dir: string;
const originalDir = FileService.getUploadDir();

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'cooking-diary-files-'));
	FileService.setUploadDir(dir);
});

afterEach(async () => {
	FileService.setUploadDir(originalDir);
	await rm(dir, { recursive: true, force: true });
});

async function storedFile(name: string) {
	await writeFile(join(dir, name), 'x');
	return `/files/${name}`;
}

const onDisk = (url: string) => existsSync(join(dir, url.slice('/files/'.length)));

describe('FileService.deleteUnreferenced', () => {
	it('deletes files nothing references', async () => {
		const owner = await createUser();
		const url = await storedFile(`${owner.id}_${crypto.randomUUID()}.jpg`);

		await FileService.deleteUnreferenced([url]);

		expect(onDisk(url)).toBe(false);
	});

	it('keeps files referenced as a meal photo', async () => {
		const owner = await createUser();
		const url = await storedFile(`${owner.id}_${crypto.randomUUID()}.jpg`);
		const meal = await createMeal(owner.id);
		await db.update(meals).set({ defaultPhotoUrl: url }).where(eq(meals.id, meal.id));

		await FileService.deleteUnreferenced([url]);

		expect(onDisk(url)).toBe(true);
	});

	it('keeps files referenced by any user in entry photos', async () => {
		const other = await createUser();
		const url = await storedFile(`${Date.now()}-legacy${crypto.randomUUID().slice(0, 8)}.png`);
		const meal = await createMeal(other.id);
		const entry = await createEntry(other.id, meal.id);
		await db
			.update(mealEntries)
			.set({ photoUrls: ['/files/unrelated.jpg', url] })
			.where(eq(mealEntries.id, entry.id));

		await FileService.deleteUnreferenced([url]);

		expect(onDisk(url)).toBe(true);
	});

	it('handles a mixed batch, deleting only the unreferenced files', async () => {
		const owner = await createUser();
		const kept = await storedFile(`${owner.id}_${crypto.randomUUID()}.jpg`);
		const removed = await storedFile(`${owner.id}_${crypto.randomUUID()}.jpg`);
		const meal = await createMeal(owner.id);
		await db.update(meals).set({ defaultPhotoUrl: kept }).where(eq(meals.id, meal.id));

		await FileService.deleteUnreferenced([kept, removed, removed]);

		expect(onDisk(kept)).toBe(true);
		expect(onDisk(removed)).toBe(false);
	});

	it('ignores missing files, non-local URLs and unsafe names without throwing', async () => {
		const outside = join(dir, '..', `outside-${crypto.randomUUID()}.jpg`);
		await writeFile(outside, 'x');
		try {
			await expect(
				FileService.deleteUnreferenced([
					`/files/${crypto.randomUUID()}.jpg`,
					'https://example.com/files/a.jpg',
					'/files/..',
					`/files/../${outside.split('/').pop()}`,
					''
				])
			).resolves.toBeUndefined();
			expect(existsSync(outside)).toBe(true);
			expect(existsSync(dir)).toBe(true);
		} finally {
			await rm(outside, { force: true });
		}
	});
});

describe('FileService.canRead', () => {
	it('allows owners and nobody else for new-style names', async () => {
		const owner = await createUser();
		const other = await createUser();
		const name = FileService.generateFilename(owner.id, 'image/jpeg');

		expect(await FileService.canRead(name, owner.id)).toBe(true);
		expect(await FileService.canRead(name, other.id)).toBe(false);
	});

	it('does not let a reference grant access to another user’s new-style file', async () => {
		const owner = await createUser();
		const other = await createUser();
		const name = FileService.generateFilename(owner.id, 'image/jpeg');
		const meal = await createMeal(other.id);
		await db
			.update(meals)
			.set({ defaultPhotoUrl: `/files/${name}` })
			.where(eq(meals.id, meal.id));

		expect(await FileService.canRead(name, other.id)).toBe(false);
	});
});
