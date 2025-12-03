import { db } from '$lib/server/db';
import { categories, mealEntries, meals, mealToCategories } from '$lib/server/db/schema';
import { and, desc, eq, inArray, like } from 'drizzle-orm';

export type MealWithCategories = {
	id: string;
	title: string;
	defaultNotes: string | null;
	defaultPhotoUrl: string | null;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
	categories: Array<{ id: string; name: string }>;
};

export class MealService {
	/**
	 * Get all meals for a user with their categories
	 */
	static async getMealsByUserId(userId: string): Promise<MealWithCategories[]> {
		const userMeals = await db
			.select()
			.from(meals)
			.where(eq(meals.userId, userId))
			.orderBy(desc(meals.createdAt));

		const mealsWithCategories = await Promise.all(
			userMeals.map(async (meal) => {
				const mealCategories = await db
					.select({
						id: categories.id,
						name: categories.name
					})
					.from(mealToCategories)
					.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
					.where(eq(mealToCategories.mealId, meal.id));

				return {
					...meal,
					categories: mealCategories
				};
			})
		);

		return mealsWithCategories;
	}

	/**
	 * Search meals by title
	 */
	static async searchMeals(userId: string, searchTerm: string): Promise<MealWithCategories[]> {
		const userMeals = await db
			.select()
			.from(meals)
			.where(and(eq(meals.userId, userId), like(meals.title, `%${searchTerm}%`)))
			.orderBy(desc(meals.createdAt));

		const mealsWithCategories = await Promise.all(
			userMeals.map(async (meal) => {
				const mealCategories = await db
					.select({
						id: categories.id,
						name: categories.name
					})
					.from(mealToCategories)
					.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
					.where(eq(mealToCategories.mealId, meal.id));

				return {
					...meal,
					categories: mealCategories
				};
			})
		);

		return mealsWithCategories;
	}

	/**
	 * Get meals by category
	 */
	static async getMealsByCategory(
		userId: string,
		categoryId: string
	): Promise<MealWithCategories[]> {
		const mealIds = await db
			.select({ mealId: mealToCategories.mealId })
			.from(mealToCategories)
			.where(eq(mealToCategories.categoryId, categoryId));

		if (mealIds.length === 0) return [];

		const mealIdList = mealIds.map((m) => m.mealId);
		if (mealIdList.length === 0) return [];

		const userMeals = await db
			.select()
			.from(meals)
			.where(and(eq(meals.userId, userId), inArray(meals.id, mealIdList)))
			.orderBy(desc(meals.createdAt));

		const mealsWithCategories = await Promise.all(
			userMeals.map(async (meal) => {
				const mealCategories = await db
					.select({
						id: categories.id,
						name: categories.name
					})
					.from(mealToCategories)
					.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
					.where(eq(mealToCategories.mealId, meal.id));

				return {
					...meal,
					categories: mealCategories
				};
			})
		);

		return mealsWithCategories;
	}

	/**
	 * Get meal by ID with categories
	 */
	static async getMealById(mealId: string, userId: string): Promise<MealWithCategories | null> {
		const meal = await db
			.select()
			.from(meals)
			.where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
			.limit(1);

		if (!meal[0]) return null;

		const mealCategories = await db
			.select({
				id: categories.id,
				name: categories.name
			})
			.from(mealToCategories)
			.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
			.where(eq(mealToCategories.mealId, mealId));

		return {
			...meal[0],
			categories: mealCategories
		};
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

		if (recentEntries.length === 0) return [];

		const uniqueMealIds = [...new Set(recentEntries.map((e) => e.mealId))];
		if (uniqueMealIds.length === 0) return [];

		const userMeals = await db
			.select()
			.from(meals)
			.where(and(eq(meals.userId, userId), inArray(meals.id, uniqueMealIds)));

		const mealsWithCategories = await Promise.all(
			userMeals.map(async (meal) => {
				const mealCategories = await db
					.select({
						id: categories.id,
						name: categories.name
					})
					.from(mealToCategories)
					.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
					.where(eq(mealToCategories.mealId, meal.id));

				return {
					...meal,
					categories: mealCategories
				};
			})
		);

		return mealsWithCategories;
	}

	/**
	 * Create a new meal
	 */
	static async createMeal(
		userId: string,
		data: {
			title: string;
			defaultNotes?: string | null;
			defaultPhotoUrl?: string | null;
			categoryIds?: string[];
		}
	): Promise<MealWithCategories> {
		const [newMeal] = await db
			.insert(meals)
			.values({
				userId,
				title: data.title,
				defaultNotes: data.defaultNotes || null,
				defaultPhotoUrl: data.defaultPhotoUrl || null
			})
			.returning();

		if (data.categoryIds && data.categoryIds.length > 0) {
			await db.insert(mealToCategories).values(
				data.categoryIds.map((categoryId) => ({
					mealId: newMeal.id,
					categoryId
				}))
			);
		}

		const mealCategories = await db
			.select({
				id: categories.id,
				name: categories.name
			})
			.from(mealToCategories)
			.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
			.where(eq(mealToCategories.mealId, newMeal.id));

		return {
			...newMeal,
			categories: mealCategories
		};
	}

	/**
	 * Update a meal
	 */
	static async updateMeal(
		mealId: string,
		userId: string,
		data: {
			title?: string;
			defaultNotes?: string | null;
			defaultPhotoUrl?: string | null;
			categoryIds?: string[];
		}
	): Promise<MealWithCategories | null> {
		// Verify ownership
		const existing = await db
			.select()
			.from(meals)
			.where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
			.limit(1);

		if (!existing[0]) return null;

		const updateData: Partial<typeof meals.$inferInsert> = {
			updatedAt: new Date()
		};

		if (data.title !== undefined) updateData.title = data.title;
		if (data.defaultNotes !== undefined) updateData.defaultNotes = data.defaultNotes;
		if (data.defaultPhotoUrl !== undefined) updateData.defaultPhotoUrl = data.defaultPhotoUrl;

		const [updated] = await db
			.update(meals)
			.set(updateData)
			.where(eq(meals.id, mealId))
			.returning();

		// Update categories if provided
		if (data.categoryIds !== undefined) {
			// Delete existing category associations
			await db.delete(mealToCategories).where(eq(mealToCategories.mealId, mealId));

			// Insert new associations
			if (data.categoryIds.length > 0) {
				await db.insert(mealToCategories).values(
					data.categoryIds.map((categoryId) => ({
						mealId,
						categoryId
					}))
				);
			}
		}

		const mealCategories = await db
			.select({
				id: categories.id,
				name: categories.name
			})
			.from(mealToCategories)
			.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
			.where(eq(mealToCategories.mealId, mealId));

		return {
			...updated,
			categories: mealCategories
		};
	}

	/**
	 * Delete a meal
	 */
	static async deleteMeal(mealId: string, userId: string): Promise<boolean> {
		const existing = await db
			.select()
			.from(meals)
			.where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
			.limit(1);

		if (!existing[0]) return false;

		await db.delete(meals).where(eq(meals.id, mealId));
		return true;
	}
}
