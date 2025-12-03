import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export class CategoryService {
	/**
	 * Get all categories for a user
	 */
	static async getCategoriesByUserId(userId: string) {
		return await db
			.select()
			.from(categories)
			.where(eq(categories.userId, userId))
			.orderBy(desc(categories.createdAt));
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

