import { existsSync } from 'fs';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/server/db';
import { mealEntries, meals, mealToCategories } from '$lib/server/db/schema';
import { createCategory, createEntry, createMeal, createUser } from '$lib/server/test/factories';
import { AnalyticsService } from './analytics.service';
import { CategoryService } from './category.service';
import { InvalidInputError, NotFoundError } from './errors';
import { FileService } from './file.service';
import { MealService } from './meal.service';

let dir: string;
const originalDir = FileService.getUploadDir();

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'cooking-diary-meals-'));
	FileService.setUploadDir(dir);
});

afterEach(async () => {
	FileService.setUploadDir(originalDir);
	await rm(dir, { recursive: true, force: true });
});

async function upload(ownerId: string) {
	const name = `${ownerId}_${crypto.randomUUID()}.jpg`;
	await writeFile(join(dir, name), 'x');
	return `/files/${name}`;
}

const onDisk = (url: string) => existsSync(join(dir, url.slice('/files/'.length)));

const linkIds = async (mealId: string) =>
	(await db.select().from(mealToCategories).where(eq(mealToCategories.mealId, mealId)))
		.map((link) => link.categoryId)
		.sort();

async function setup() {
	const alice = await createUser('Alice');
	const bob = await createUser('Bob');
	const aliceCategory = await createCategory(alice.id, 'Alice category');
	const aliceMeal = await createMeal(alice.id, 'Alice meal');
	const bobCategory = await createCategory(bob.id, 'Bob category');
	const bobMeal = await createMeal(bob.id, 'Bob meal');
	return { alice, bob, aliceCategory, aliceMeal, bobCategory, bobMeal };
}

describe('MealService.createMeal', () => {
	it('links the owner’s categories', async () => {
		const { bob, bobCategory } = await setup();
		const meal = await MealService.createMeal(bob.id, {
			title: 'Stew',
			categoryIds: [bobCategory.id, bobCategory.id]
		});
		expect(meal.categories).toEqual([{ id: bobCategory.id, name: bobCategory.name }]);
	});

	it.each([
		['another user’s category', (s: Awaited<ReturnType<typeof setup>>) => s.aliceCategory.id],
		['a nonexistent category', () => crypto.randomUUID()],
		['a malformed id', () => 'not-a-uuid']
	])('rejects %s and creates nothing', async (_, pick) => {
		const s = await setup();
		await expect(
			MealService.createMeal(s.bob.id, { title: 'Stew', categoryIds: [s.bobCategory.id, pick(s)] })
		).rejects.toBeInstanceOf(NotFoundError);

		const bobMeals = await db.select().from(meals).where(eq(meals.userId, s.bob.id));
		expect(bobMeals.map((m) => m.title)).toEqual(['Bob meal']);
	});
});

describe('MealService.updateMeal', () => {
	it('replaces the category links', async () => {
		const { bob, bobMeal, bobCategory } = await setup();
		const second = await createCategory(bob.id, 'Second');
		await MealService.updateMeal(bobMeal.id, bob.id, { categoryIds: [bobCategory.id] });

		const updated = await MealService.updateMeal(bobMeal.id, bob.id, { categoryIds: [second.id] });

		expect(updated.categories.map((c) => c.id)).toEqual([second.id]);
		expect(await linkIds(bobMeal.id)).toEqual([second.id]);
	});

	it('rejects another user’s category and leaves the meal and its links untouched', async () => {
		const { bob, bobMeal, bobCategory, aliceCategory } = await setup();
		await MealService.updateMeal(bobMeal.id, bob.id, { categoryIds: [bobCategory.id] });

		await expect(
			MealService.updateMeal(bobMeal.id, bob.id, {
				title: 'Renamed',
				categoryIds: [aliceCategory.id]
			})
		).rejects.toBeInstanceOf(NotFoundError);

		expect(await linkIds(bobMeal.id)).toEqual([bobCategory.id]);
		expect((await MealService.getMealById(bobMeal.id, bob.id))?.title).toBe('Bob meal');
	});

	it('treats another user’s meal as not found and leaves it untouched', async () => {
		const { bob, aliceMeal, alice } = await setup();
		await expect(
			MealService.updateMeal(aliceMeal.id, bob.id, { title: 'Hijacked' })
		).rejects.toBeInstanceOf(NotFoundError);
		await expect(
			MealService.updateMeal('not-a-uuid', bob.id, { title: 'x' })
		).rejects.toBeInstanceOf(NotFoundError);
		expect((await MealService.getMealById(aliceMeal.id, alice.id))?.title).toBe('Alice meal');
	});

	it('deletes the replaced photo after commit and keeps the new one', async () => {
		const { bob, bobMeal } = await setup();
		const first = await upload(bob.id);
		const second = await upload(bob.id);
		await MealService.updateMeal(bobMeal.id, bob.id, { defaultPhotoUrl: first });

		await MealService.updateMeal(bobMeal.id, bob.id, { defaultPhotoUrl: second });

		expect(onDisk(first)).toBe(false);
		expect(onDisk(second)).toBe(true);
	});

	it('keeps the photo when other fields change', async () => {
		const { bob, bobMeal } = await setup();
		const photo = await upload(bob.id);
		await MealService.updateMeal(bobMeal.id, bob.id, { defaultPhotoUrl: photo });

		await MealService.updateMeal(bobMeal.id, bob.id, { title: 'Renamed', defaultPhotoUrl: photo });

		expect(onDisk(photo)).toBe(true);
	});

	it('rejects photos the user does not own', async () => {
		const { alice, bob, bobMeal } = await setup();
		const alicePhoto = await upload(alice.id);
		const legacy = '/files/1700000000000-abcdef.jpg';

		for (const url of [alicePhoto, legacy, 'https://tracker.example/pixel.gif']) {
			await expect(
				MealService.updateMeal(bobMeal.id, bob.id, { defaultPhotoUrl: url })
			).rejects.toBeInstanceOf(InvalidInputError);
		}
	});

	it('accepts a legacy photo the user already references', async () => {
		const { bob, bobMeal } = await setup();
		const legacy = '/files/1700000000000-abcdef.jpg';
		const entry = await createEntry(bob.id, bobMeal.id);
		await db
			.update(mealEntries)
			.set({ photoUrls: [legacy] })
			.where(eq(mealEntries.id, entry.id));

		const updated = await MealService.updateMeal(bobMeal.id, bob.id, { defaultPhotoUrl: legacy });
		expect(updated.defaultPhotoUrl).toBe(legacy);
	});
});

describe('MealService.deleteMeal', () => {
	it('treats another user’s meal as not found', async () => {
		const { alice, bob, aliceMeal } = await setup();
		await expect(MealService.deleteMeal(aliceMeal.id, bob.id)).rejects.toBeInstanceOf(
			NotFoundError
		);
		expect(await MealService.getMealById(aliceMeal.id, alice.id)).not.toBeNull();
	});

	it('deletes the meal photo and the photos of its cascaded entries', async () => {
		const { bob, bobMeal } = await setup();
		const mealPhoto = await upload(bob.id);
		const entryPhoto = await upload(bob.id);
		await MealService.updateMeal(bobMeal.id, bob.id, { defaultPhotoUrl: mealPhoto });
		const entry = await createEntry(bob.id, bobMeal.id);
		await db
			.update(mealEntries)
			.set({ photoUrls: [entryPhoto] })
			.where(eq(mealEntries.id, entry.id));

		await MealService.deleteMeal(bobMeal.id, bob.id);

		expect(onDisk(mealPhoto)).toBe(false);
		expect(onDisk(entryPhoto)).toBe(false);
		expect(await db.select().from(mealEntries).where(eq(mealEntries.id, entry.id))).toEqual([]);
	});
});

describe('user-scoped meal reads', () => {
	it('never return other users’ meals', async () => {
		const { alice, bob, aliceMeal, aliceCategory, bobMeal } = await setup();
		await MealService.updateMeal(aliceMeal.id, alice.id, { categoryIds: [aliceCategory.id] });
		await createEntry(alice.id, aliceMeal.id, new Date().toISOString().slice(0, 10));

		const ids = (list: { id: string }[]) => list.map((m) => m.id);
		expect(ids(await MealService.getMealsByUserId(bob.id))).toEqual([bobMeal.id]);
		expect(ids(await MealService.searchMeals(bob.id, 'meal'))).toEqual([bobMeal.id]);
		expect(await MealService.getMealsByCategories(bob.id, [aliceCategory.id])).toEqual([]);
		expect(await MealService.getRecentMeals(bob.id)).toEqual([]);
		expect(ids(await MealService.getMealsNotCookedRecently(bob.id))).toEqual([bobMeal.id]);
		expect(await MealService.getMealById(aliceMeal.id, bob.id)).toBeNull();
		expect(await MealService.getMealById('not-a-uuid', bob.id)).toBeNull();
	});

	it('hide other users’ categories linked before ownership was checked', async () => {
		const { alice, aliceMeal, aliceCategory, bobCategory } = await setup();
		await db.insert(mealToCategories).values({ mealId: aliceMeal.id, categoryId: bobCategory.id });

		expect((await MealService.getMealById(aliceMeal.id, alice.id))?.categories).toEqual([]);
		expect(await MealService.getMealsByCategories(alice.id, [bobCategory.id])).toEqual([]);
		const stats = await AnalyticsService.getCategoryStatistics(alice.id);
		expect(stats.map((c) => c.categoryId)).toEqual([aliceCategory.id]);
	});

	it('exclude other users’ meals and categories from analytics', async () => {
		const { alice, bob, aliceMeal, aliceCategory } = await setup();
		await MealService.updateMeal(aliceMeal.id, alice.id, { categoryIds: [aliceCategory.id] });
		// An entry of Bob's pointing at Alice's meal, as could be written before the check.
		const entry = await createEntry(bob.id, aliceMeal.id, '2026-01-05');

		expect(await AnalyticsService.getTopMeals(bob.id)).toEqual([]);
		expect(
			await AnalyticsService.getTopCategoriesForDay(bob.id, new Date('2026-01-05').getUTCDay())
		).toEqual([]);
		expect(await AnalyticsService.getCategoryDayOfWeekPatterns(bob.id)).toEqual([]);
		await db.delete(mealEntries).where(eq(mealEntries.id, entry.id));
	});
});

describe('CategoryService', () => {
	it('treats another user’s category as not found', async () => {
		const { alice, bob, aliceCategory } = await setup();
		await expect(
			CategoryService.updateCategory(aliceCategory.id, bob.id, 'Hijacked')
		).rejects.toBeInstanceOf(NotFoundError);
		await expect(CategoryService.deleteCategory(aliceCategory.id, bob.id)).rejects.toBeInstanceOf(
			NotFoundError
		);
		await expect(CategoryService.deleteCategory('nope', bob.id)).rejects.toBeInstanceOf(
			NotFoundError
		);
		expect((await CategoryService.getCategoryById(aliceCategory.id, alice.id))?.name).toBe(
			'Alice category'
		);
		expect(await CategoryService.getCategoryById(aliceCategory.id, bob.id)).toBeNull();
	});

	it('lists only the user’s categories and meals', async () => {
		const { bob, bobCategory } = await setup();
		const list = await CategoryService.getCategoriesWithMealsByUserId(bob.id);
		expect(list.map((c) => c.id)).toEqual([bobCategory.id]);
	});
});
