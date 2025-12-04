import { db } from '$lib/server/db';
import { categories, mealToCategories, meals } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { MealWithCategories } from './meal.service';

export type CategoryWithMeals = {
	id: string;
	userId: string;
	name: string;
	createdAt: Date;
	meals: Array<{ id: string; title: string }>;
};

export class CategoryService {
	/**
	 * Get all categories for a user
	 */
	static async getCategoriesByUserId(userId: string) {
		return await db
			.select()
			.from(categories)
			.where(eq(categories.userId, userId))
			.orderBy(asc(categories.name));
	}

	/**
	 * Get all categories for a user with their meals
	 */
	static async getCategoriesWithMealsByUserId(userId: string): Promise<CategoryWithMeals[]> {
		const userCategories = await db
			.select()
			.from(categories)
			.where(eq(categories.userId, userId))
			.orderBy(asc(categories.name));

		const categoriesWithMeals = await Promise.all(
			userCategories.map(async (category) => {
				const categoryMeals = await db
					.select({
						id: meals.id,
						title: meals.title
					})
					.from(mealToCategories)
					.innerJoin(meals, eq(mealToCategories.mealId, meals.id))
					.where(and(eq(mealToCategories.categoryId, category.id), eq(meals.userId, userId)))
					.orderBy(asc(meals.title));

				return {
					...category,
					meals: categoryMeals
				};
			})
		);

		return categoriesWithMeals;
	}

	/**
	 * Get category by ID
	 */
	static async getCategoryById(categoryId: string, userId: string) {
		const result = await db
			.select()
			.from(categories)
			.where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * Create a new category
	 */
	static async createCategory(userId: string, name: string) {
		const [newCategory] = await db
			.insert(categories)
			.values({
				userId,
				name
			})
			.returning();
		return newCategory;
	}

	/**
	 * Update a category
	 */
	static async updateCategory(categoryId: string, userId: string, name: string) {
		const existing = await db
			.select()
			.from(categories)
			.where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
			.limit(1);

		if (!existing[0]) return null;

		const [updated] = await db
			.update(categories)
			.set({ name })
			.where(eq(categories.id, categoryId))
			.returning();

		return updated;
	}

	/**
	 * Delete a category
	 */
	static async deleteCategory(categoryId: string, userId: string): Promise<boolean> {
		const existing = await db
			.select()
			.from(categories)
			.where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
			.limit(1);

		if (!existing[0]) return false;

		await db.delete(categories).where(eq(categories.id, categoryId));
		return true;
	}
}

