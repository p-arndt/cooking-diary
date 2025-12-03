import { db } from '$lib/server/db';
import { mealEntries, meals, categories, mealToCategories } from '$lib/server/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

export type EntryWithMeal = {
	id: string;
	userId: string;
	mealId: string;
	dateCooked: Date;
	notes: string | null;
	photoUrls: string[] | null;
	createdAt: Date;
	updatedAt: Date;
	meal: {
		id: string;
		title: string;
		defaultNotes: string | null;
		defaultPhotoUrl: string | null;
		categories: Array<{ id: string; name: string }>;
	};
};

export class EntryService {
	/**
	 * Get entries for a date range
	 */
	static async getEntriesByDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<EntryWithMeal[]> {
		const entries = await db
			.select()
			.from(mealEntries)
			.where(
				and(
					eq(mealEntries.userId, userId),
					gte(mealEntries.dateCooked, startDate.toISOString().split('T')[0]),
					lte(mealEntries.dateCooked, endDate.toISOString().split('T')[0])
				)
			)
			.orderBy(desc(mealEntries.dateCooked));

		const entriesWithMeals = await Promise.all(
			entries.map(async (entry) => {
				const meal = await db
					.select()
					.from(meals)
					.where(eq(meals.id, entry.mealId))
					.limit(1);

				if (!meal[0]) {
					throw new Error(`Meal not found for entry ${entry.id}`);
				}

				const mealCategories = await db
					.select({
						id: categories.id,
						name: categories.name
					})
					.from(mealToCategories)
					.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
					.where(eq(mealToCategories.mealId, entry.mealId));

				return {
					...entry,
					meal: {
						...meal[0],
						categories: mealCategories
					}
				};
			})
		);

		return entriesWithMeals;
	}

	/**
	 * Get entries for a specific date
	 */
	static async getEntriesByDate(userId: string, date: Date): Promise<EntryWithMeal[]> {
		const dateStr = date.toISOString().split('T')[0];
		const entries = await db
			.select()
			.from(mealEntries)
			.where(and(eq(mealEntries.userId, userId), eq(mealEntries.dateCooked, dateStr)))
			.orderBy(desc(mealEntries.createdAt));

		const entriesWithMeals = await Promise.all(
			entries.map(async (entry) => {
				const meal = await db
					.select()
					.from(meals)
					.where(eq(meals.id, entry.mealId))
					.limit(1);

				if (!meal[0]) {
					throw new Error(`Meal not found for entry ${entry.id}`);
				}

				const mealCategories = await db
					.select({
						id: categories.id,
						name: categories.name
					})
					.from(mealToCategories)
					.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
					.where(eq(mealToCategories.mealId, entry.mealId));

				return {
					...entry,
					meal: {
						...meal[0],
						categories: mealCategories
					}
				};
			})
		);

		return entriesWithMeals;
	}

	/**
	 * Get all entries for a user (timeline view)
	 */
	static async getAllEntries(userId: string, limit?: number): Promise<EntryWithMeal[]> {
		let query = db
			.select()
			.from(mealEntries)
			.where(eq(mealEntries.userId, userId))
			.orderBy(desc(mealEntries.dateCooked));

		if (limit) {
			query = query.limit(limit) as typeof query;
		}

		const entries = await query;

		const entriesWithMeals = await Promise.all(
			entries.map(async (entry) => {
				const meal = await db
					.select()
					.from(meals)
					.where(eq(meals.id, entry.mealId))
					.limit(1);

				if (!meal[0]) {
					throw new Error(`Meal not found for entry ${entry.id}`);
				}

				const mealCategories = await db
					.select({
						id: categories.id,
						name: categories.name
					})
					.from(mealToCategories)
					.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
					.where(eq(mealToCategories.mealId, entry.mealId));

				return {
					...entry,
					meal: {
						...meal[0],
						categories: mealCategories
					}
				};
			})
		);

		return entriesWithMeals;
	}

	/**
	 * Get dates that have entries (for calendar view)
	 */
	static async getDatesWithEntries(userId: string, startDate: Date, endDate: Date): Promise<string[]> {
		const entries = await db
			.select({ dateCooked: mealEntries.dateCooked })
			.from(mealEntries)
			.where(
				and(
					eq(mealEntries.userId, userId),
					gte(mealEntries.dateCooked, startDate.toISOString().split('T')[0]),
					lte(mealEntries.dateCooked, endDate.toISOString().split('T')[0])
				)
			);

		const uniqueDates = [...new Set(entries.map((e) => e.dateCooked))];
		return uniqueDates;
	}

	/**
	 * Create a new entry
	 */
	static async createEntry(
		userId: string,
		data: {
			mealId: string;
			dateCooked: Date;
			notes?: string | null;
			photoUrls?: string[];
		}
	): Promise<EntryWithMeal> {
		const [newEntry] = await db
			.insert(mealEntries)
			.values({
				userId,
				mealId: data.mealId,
				dateCooked: data.dateCooked.toISOString().split('T')[0],
				notes: data.notes || null,
				photoUrls: data.photoUrls || []
			})
			.returning();

		const meal = await db.select().from(meals).where(eq(meals.id, data.mealId)).limit(1);

		if (!meal[0]) {
			throw new Error(`Meal not found: ${data.mealId}`);
		}

		const mealCategories = await db
			.select({
				id: categories.id,
				name: categories.name
			})
			.from(mealToCategories)
			.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
			.where(eq(mealToCategories.mealId, data.mealId));

		return {
			...newEntry,
			meal: {
				...meal[0],
				categories: mealCategories
			}
		};
	}

	/**
	 * Update an entry
	 */
	static async updateEntry(
		entryId: string,
		userId: string,
		data: {
			notes?: string | null;
			photoUrls?: string[];
		}
	): Promise<EntryWithMeal | null> {
		const existing = await db
			.select()
			.from(mealEntries)
			.where(and(eq(mealEntries.id, entryId), eq(mealEntries.userId, userId)))
			.limit(1);

		if (!existing[0]) return null;

		const updateData: Partial<typeof mealEntries.$inferInsert> = {
			updatedAt: new Date()
		};

		if (data.notes !== undefined) updateData.notes = data.notes;
		if (data.photoUrls !== undefined) updateData.photoUrls = data.photoUrls;

		const [updated] = await db
			.update(mealEntries)
			.set(updateData)
			.where(eq(mealEntries.id, entryId))
			.returning();

		const meal = await db.select().from(meals).where(eq(meals.id, updated.mealId)).limit(1);

		if (!meal[0]) {
			throw new Error(`Meal not found: ${updated.mealId}`);
		}

		const mealCategories = await db
			.select({
				id: categories.id,
				name: categories.name
			})
			.from(mealToCategories)
			.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
			.where(eq(mealToCategories.mealId, updated.mealId));

		return {
			...updated,
			meal: {
				...meal[0],
				categories: mealCategories
			}
		};
	}

	/**
	 * Delete an entry
	 */
	static async deleteEntry(entryId: string, userId: string): Promise<boolean> {
		const existing = await db
			.select()
			.from(mealEntries)
			.where(and(eq(mealEntries.id, entryId), eq(mealEntries.userId, userId)))
			.limit(1);

		if (!existing[0]) return false;

		await db.delete(mealEntries).where(eq(mealEntries.id, entryId));
		return true;
	}

	/**
	 * Get entries for a specific meal (when cooked)
	 */
	static async getEntriesByMealId(userId: string, mealId: string): Promise<EntryWithMeal[]> {
		const entries = await db
			.select()
			.from(mealEntries)
			.where(and(eq(mealEntries.userId, userId), eq(mealEntries.mealId, mealId)))
			.orderBy(desc(mealEntries.dateCooked));

		const meal = await db.select().from(meals).where(eq(meals.id, mealId)).limit(1);

		if (!meal[0]) {
			return [];
		}

		const mealCategories = await db
			.select({
				id: categories.id,
				name: categories.name
			})
			.from(mealToCategories)
			.innerJoin(categories, eq(mealToCategories.categoryId, categories.id))
			.where(eq(mealToCategories.mealId, mealId));

		return entries.map((entry) => ({
			...entry,
			meal: {
				...meal[0],
				categories: mealCategories
			}
		}));
	}
}

