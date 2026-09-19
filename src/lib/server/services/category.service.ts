import { db } from '$lib/server/db';
import { categories, mealToCategories, meals } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { isUuid } from '$lib/schemas';
import { NotFoundError } from './errors';

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
		if (!isUuid(categoryId)) return null;
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
	 * Rename a category. Throws NotFoundError if it is missing or not the user's.
	 */
	static async updateCategory(categoryId: string, userId: string, name: string) {
		if (!isUuid(categoryId)) throw new NotFoundError('Category');
		const [updated] = await db
			.update(categories)
			.set({ name })
			.where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
			.returning();
		if (!updated) throw new NotFoundError('Category');
		return updated;
	}

	/**
	 * Delete a category. Throws NotFoundError if it is missing or not the user's.
	 */
	static async deleteCategory(categoryId: string, userId: string): Promise<void> {
		if (!isUuid(categoryId)) throw new NotFoundError('Category');
		const [deleted] = await db
			.delete(categories)
			.where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
			.returning({ id: categories.id });
		if (!deleted) throw new NotFoundError('Category');
	}
}
