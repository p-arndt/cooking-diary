import { db } from '$lib/server/db';
import { categories, mealEntries, meals, mealToCategories } from '$lib/server/db/schema';
import { and, asc, desc, eq, gte, inArray, like, notInArray, sql } from 'drizzle-orm';
import { isUuid } from '$lib/schemas';
import { NotFoundError } from './errors';
import { FileService } from './file.service';
import { assertOwnPhotoUrls, removedUrls } from './photo-urls';

export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

type MealRow = typeof meals.$inferSelect;

export type MealWithCategories = {
	id: string;
	title: string;
	defaultNotes: string | null;
	defaultPhotoUrl: string | null;
	prepTime: string | null;
	cookTime: string | null;
	difficulty: string | null;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
	categories: Array<{ id: string; name: string }>;
};

export type MealData = {
	title: string;
	defaultNotes?: string | null;
	defaultPhotoUrl?: string | null;
	prepTime?: string | null;
	cookTime?: string | null;
	difficulty?: string | null;
	categoryIds?: string[];
};

/** Loads the categories of the given meals; categories of other users are never returned. */
async function withCategories(
	executor: DbExecutor,
	userId: string,
	rows: MealRow[]
): Promise<MealWithCategories[]> {
	if (rows.length === 0) return [];

	const links = await executor
		.select({ mealId: mealToCategories.mealId, id: categories.id, name: categories.name })
		.from(mealToCategories)
		.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
		.where(
			and(
				inArray(
					mealToCategories.mealId,
					rows.map((meal) => meal.id)
				),
				eq(categories.userId, userId)
			)
		)
		.orderBy(asc(categories.name));

	return rows.map((meal) => ({
		...meal,
		categories: links
			.filter((link) => link.mealId === meal.id)
			.map(({ id, name }) => ({ id, name }))
	}));
}

/** Deduplicated ids, all owned by the user; anything else is reported as not found. */
async function ownedCategoryIds(
	executor: DbExecutor,
	userId: string,
	categoryIds: string[]
): Promise<string[]> {
	const unique = [...new Set(categoryIds)];
	if (unique.length === 0) return unique;
	if (!unique.every(isUuid)) throw new NotFoundError('Category');

	const owned = await executor
		.select({ id: categories.id })
		.from(categories)
		.where(and(eq(categories.userId, userId), inArray(categories.id, unique)));
	if (owned.length !== unique.length) throw new NotFoundError('Category');
	return unique;
}

export class MealService {
	/**
	 * Meals of the user keyed by id; ids of missing or foreign meals are simply absent.
	 * Accepts a transaction so callers can check ownership atomically with their write.
	 */
	static async getOwnedMealsByIds(
		executor: DbExecutor,
		userId: string,
		mealIds: string[]
	): Promise<Map<string, MealWithCategories>> {
		const ids = [...new Set(mealIds)].filter(isUuid);
		if (ids.length === 0) return new Map();

		const rows = await executor
			.select()
			.from(meals)
			.where(and(eq(meals.userId, userId), inArray(meals.id, ids)));
		const loaded = await withCategories(executor, userId, rows);
		return new Map(loaded.map((meal) => [meal.id, meal]));
	}

	/**
	 * Get all meals for a user with their categories
	 */
	static async getMealsByUserId(userId: string): Promise<MealWithCategories[]> {
		const rows = await db
			.select()
			.from(meals)
			.where(eq(meals.userId, userId))
			.orderBy(asc(meals.title));
		return withCategories(db, userId, rows);
	}

	/**
	 * Search meals by title (case-insensitive)
	 */
	static async searchMeals(userId: string, searchTerm: string): Promise<MealWithCategories[]> {
		const lowerSearch = searchTerm.toLowerCase();
		const rows = await db
			.select()
			.from(meals)
			.where(and(eq(meals.userId, userId), like(sql`LOWER(${meals.title})`, `%${lowerSearch}%`)))
			.orderBy(asc(meals.title));
		return withCategories(db, userId, rows);
	}

	/**
	 * Get meals by category
	 */
	static async getMealsByCategory(
		userId: string,
		categoryId: string
	): Promise<MealWithCategories[]> {
		return this.getMealsByCategories(userId, [categoryId]);
	}

	/**
	 * Get meals by multiple categories (meals that have ANY of the selected categories)
	 */
	static async getMealsByCategories(
		userId: string,
		categoryIds: string[]
	): Promise<MealWithCategories[]> {
		if (categoryIds.length === 0) return this.getMealsByUserId(userId);

		const ids = categoryIds.filter(isUuid);
		if (ids.length === 0) return [];

		const rows = await db
			.selectDistinct({ meal: meals })
			.from(meals)
			.innerJoin(mealToCategories, eq(mealToCategories.mealId, meals.id))
			.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
			.where(
				and(eq(meals.userId, userId), eq(categories.userId, userId), inArray(categories.id, ids))
			)
			.orderBy(asc(meals.title));
		return withCategories(
			db,
			userId,
			rows.map((row) => row.meal)
		);
	}

	/**
	 * Get meal by ID with categories
	 */
	static async getMealById(mealId: string, userId: string): Promise<MealWithCategories | null> {
		const found = await this.getOwnedMealsByIds(db, userId, [mealId]);
		return found.get(mealId) ?? null;
	}

	/**
	 * Get recent meals (meals that have been cooked recently)
	 */
	static async getRecentMeals(userId: string, limit: number = 10): Promise<MealWithCategories[]> {
		const recentEntries = await db
			.select({ mealId: mealEntries.mealId })
			.from(mealEntries)
			.where(eq(mealEntries.userId, userId))
			.orderBy(desc(mealEntries.dateCooked))
			.limit(limit);

		const mealIds = [...new Set(recentEntries.map((e) => e.mealId))];
		const found = await this.getOwnedMealsByIds(db, userId, mealIds);
		return mealIds.flatMap((id) => found.get(id) ?? []);
	}

	/**
	 * Create a new meal together with its category links, atomically.
	 * Throws NotFoundError if any category is not the user's.
	 */
	static async createMeal(userId: string, data: MealData): Promise<MealWithCategories> {
		if (data.defaultPhotoUrl) await assertOwnPhotoUrls(userId, [data.defaultPhotoUrl]);

		return db.transaction(async (tx) => {
			const categoryIds = await ownedCategoryIds(tx, userId, data.categoryIds ?? []);

			const [newMeal] = await tx
				.insert(meals)
				.values({
					userId,
					title: data.title,
					defaultNotes: data.defaultNotes || null,
					defaultPhotoUrl: data.defaultPhotoUrl || null,
					prepTime: data.prepTime || null,
					cookTime: data.cookTime || null,
					difficulty: data.difficulty || null
				})
				.returning();

			if (categoryIds.length > 0) {
				await tx
					.insert(mealToCategories)
					.values(categoryIds.map((categoryId) => ({ mealId: newMeal.id, categoryId })));
			}

			const [created] = await withCategories(tx, userId, [newMeal]);
			return created;
		});
	}

	/**
	 * Update a meal; `categoryIds`, when given, replaces all links atomically.
	 * Throws NotFoundError for a missing or foreign meal or category.
	 */
	static async updateMeal(
		mealId: string,
		userId: string,
		data: Partial<MealData>
	): Promise<MealWithCategories> {
		if (!isUuid(mealId)) throw new NotFoundError('Meal');
		if (data.defaultPhotoUrl) await assertOwnPhotoUrls(userId, [data.defaultPhotoUrl]);

		const { meal, removed } = await db.transaction(async (tx) => {
			const [existing] = await tx
				.select()
				.from(meals)
				.where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
				.for('update');
			if (!existing) throw new NotFoundError('Meal');

			const categoryIds =
				data.categoryIds !== undefined
					? await ownedCategoryIds(tx, userId, data.categoryIds)
					: undefined;

			const updateData: Partial<typeof meals.$inferInsert> = { updatedAt: new Date() };
			if (data.title !== undefined) updateData.title = data.title;
			if (data.defaultNotes !== undefined) updateData.defaultNotes = data.defaultNotes;
			if (data.defaultPhotoUrl !== undefined) updateData.defaultPhotoUrl = data.defaultPhotoUrl;
			if (data.prepTime !== undefined) updateData.prepTime = data.prepTime;
			if (data.cookTime !== undefined) updateData.cookTime = data.cookTime;
			if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;

			const [updated] = await tx
				.update(meals)
				.set(updateData)
				.where(eq(meals.id, mealId))
				.returning();

			if (categoryIds !== undefined) {
				await tx.delete(mealToCategories).where(eq(mealToCategories.mealId, mealId));
				if (categoryIds.length > 0) {
					await tx
						.insert(mealToCategories)
						.values(categoryIds.map((categoryId) => ({ mealId, categoryId })));
				}
			}

			const [result] = await withCategories(tx, userId, [updated]);
			return {
				meal: result,
				removed: removedUrls([existing.defaultPhotoUrl], [updated.defaultPhotoUrl])
			};
		});

		await FileService.deleteUnreferenced(removed);
		return meal;
	}

	/**
	 * Delete a meal and, through the cascade, its entries. Throws NotFoundError for a
	 * missing or foreign meal.
	 */
	static async deleteMeal(mealId: string, userId: string): Promise<void> {
		if (!isUuid(mealId)) throw new NotFoundError('Meal');

		const removed = await db.transaction(async (tx) => {
			// Every entry of the meal is cascaded, whoever owns it, so all their photos go too.
			const cascadedEntries = await tx
				.select({ photoUrls: mealEntries.photoUrls })
				.from(mealEntries)
				.where(eq(mealEntries.mealId, mealId));

			const [deleted] = await tx
				.delete(meals)
				.where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
				.returning();
			if (!deleted) throw new NotFoundError('Meal');

			return [deleted.defaultPhotoUrl, ...cascadedEntries.flatMap((e) => e.photoUrls ?? [])];
		});

		await FileService.deleteUnreferenced(removedUrls(removed, []));
	}

	/**
	 * Get meals not cooked recently (for suggestions)
	 * Returns meals that haven't been cooked in the last X days, or never cooked
	 */
	static async getMealsNotCookedRecently(
		userId: string,
		daysThreshold: number = 14
	): Promise<MealWithCategories[]> {
		const thresholdDate = new Date();
		thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
		const thresholdStr = thresholdDate.toISOString().split('T')[0];

		const recentlyCooked = await db
			.selectDistinct({ mealId: mealEntries.mealId })
			.from(mealEntries)
			.where(and(eq(mealEntries.userId, userId), gte(mealEntries.dateCooked, thresholdStr)));

		const recentMealIds = recentlyCooked.map((e) => e.mealId);

		const rows = await db
			.select()
			.from(meals)
			.where(
				recentMealIds.length > 0
					? and(eq(meals.userId, userId), notInArray(meals.id, recentMealIds))
					: eq(meals.userId, userId)
			);
		return withCategories(db, userId, rows);
	}

	/**
	 * Get a random meal suggestion with user preferences
	 */
	static async getRandomMealSuggestion(
		userId: string,
		options?: {
			daysThreshold?: number;
			useDayOfWeek?: boolean;
			excludedCategoryIds?: string[];
			preferredCategoryIdsForToday?: string[];
		}
	): Promise<MealWithCategories | null> {
		const daysThreshold = options?.daysThreshold ?? 14;
		const excludedCategoryIds = options?.excludedCategoryIds ?? [];
		const preferredCategoryIds = options?.preferredCategoryIdsForToday ?? [];

		let candidates = await this.getMealsNotCookedRecently(userId, daysThreshold);

		if (excludedCategoryIds.length > 0) {
			candidates = candidates.filter(
				(meal) => !meal.categories.some((c) => excludedCategoryIds.includes(c.id))
			);
		}

		if (preferredCategoryIds.length > 0 && options?.useDayOfWeek) {
			const preferredMeals = candidates.filter((meal) =>
				meal.categories.some((c) => preferredCategoryIds.includes(c.id))
			);
			if (preferredMeals.length > 0) {
				candidates = preferredMeals;
			}
		}

		if (candidates.length > 0) {
			const randomIndex = Math.floor(Math.random() * candidates.length);
			return candidates[randomIndex];
		}

		let allMeals = await this.getMealsByUserId(userId);
		if (excludedCategoryIds.length > 0) {
			allMeals = allMeals.filter(
				(meal) => !meal.categories.some((c) => excludedCategoryIds.includes(c.id))
			);
		}

		if (allMeals.length === 0) return null;

		const randomIndex = Math.floor(Math.random() * allMeals.length);
		return allMeals[randomIndex];
	}

	/**
	 * Get meals for suggestion based on user settings
	 */
	static async getMealsForSuggestion(
		userId: string,
		options?: {
			daysThreshold?: number;
			excludedCategoryIds?: string[];
			preferredCategoryIds?: string[];
		}
	): Promise<MealWithCategories[]> {
		const daysThreshold = options?.daysThreshold ?? 14;
		const excludedCategoryIds = options?.excludedCategoryIds ?? [];
		const preferredCategoryIds = options?.preferredCategoryIds ?? [];

		let candidates = await this.getMealsNotCookedRecently(userId, daysThreshold);

		if (excludedCategoryIds.length > 0) {
			candidates = candidates.filter(
				(meal) => !meal.categories.some((c) => excludedCategoryIds.includes(c.id))
			);
		}

		if (preferredCategoryIds.length > 0) {
			const preferred = candidates.filter((meal) =>
				meal.categories.some((c) => preferredCategoryIds.includes(c.id))
			);
			const others = candidates.filter(
				(meal) => !meal.categories.some((c) => preferredCategoryIds.includes(c.id))
			);
			candidates = [...preferred, ...others];
		}

		return candidates;
	}
}
