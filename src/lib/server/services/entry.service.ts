import { db } from '$lib/server/db';
import { mealEntries } from '$lib/server/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { isUuid } from '$lib/schemas';
import { NotFoundError } from './errors';
import { FileService } from './file.service';
import { MealService, type DbExecutor, type MealWithCategories } from './meal.service';
import { assertOwnPhotoUrls, removedUrls } from './photo-urls';

type EntryRow = typeof mealEntries.$inferSelect;

export type EntryWithMeal = Omit<EntryRow, 'dateCooked'> & {
	dateCooked: Date;
	meal: MealWithCategories;
};

export type EntryData = {
	mealId: string;
	/** A `YYYY-MM-DD` string, or a Date whose UTC day is used. */
	dateCooked: Date | string;
	notes?: string | null;
	photoUrls?: string[];
};

function toDateString(date: Date | string): string {
	return typeof date === 'string' ? date : date.toISOString().split('T')[0];
}

/**
 * Joins each entry with its meal. Meals are loaded only among the user's own, so an entry
 * pointing at someone else's meal (possible in data written before ownership was checked)
 * is dropped instead of leaking that meal.
 */
async function withMeals(
	executor: DbExecutor,
	userId: string,
	rows: EntryRow[]
): Promise<EntryWithMeal[]> {
	const mealsById = await MealService.getOwnedMealsByIds(
		executor,
		userId,
		rows.map((entry) => entry.mealId)
	);
	return rows.flatMap((entry) => {
		const meal = mealsById.get(entry.mealId);
		return meal ? [{ ...entry, dateCooked: new Date(entry.dateCooked), meal }] : [];
	});
}

async function assertOwnMeal(executor: DbExecutor, userId: string, mealId: string) {
	const found = await MealService.getOwnedMealsByIds(executor, userId, [mealId]);
	if (!found.has(mealId)) throw new NotFoundError('Meal');
}

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
					gte(mealEntries.dateCooked, toDateString(startDate)),
					lte(mealEntries.dateCooked, toDateString(endDate))
				)
			)
			.orderBy(desc(mealEntries.dateCooked));
		return withMeals(db, userId, entries);
	}

	/**
	 * Get entries for a specific date
	 */
	static async getEntriesByDate(userId: string, date: Date): Promise<EntryWithMeal[]> {
		const entries = await db
			.select()
			.from(mealEntries)
			.where(and(eq(mealEntries.userId, userId), eq(mealEntries.dateCooked, toDateString(date))))
			.orderBy(desc(mealEntries.createdAt));
		return withMeals(db, userId, entries);
	}

	/**
	 * Get all entries for a user (timeline view) with pagination
	 */
	static async getAllEntries(
		userId: string,
		limit: number = 20,
		offset: number = 0
	): Promise<{ entries: EntryWithMeal[]; hasMore: boolean }> {
		const entries = await db
			.select()
			.from(mealEntries)
			.where(eq(mealEntries.userId, userId))
			.orderBy(desc(mealEntries.dateCooked))
			.limit(limit + 1)
			.offset(offset);

		const hasMore = entries.length > limit;
		const page = hasMore ? entries.slice(0, limit) : entries;
		return { entries: await withMeals(db, userId, page), hasMore };
	}

	/**
	 * Get dates that have entries (for calendar view)
	 */
	static async getDatesWithEntries(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<string[]> {
		const entries = await db
			.select({ dateCooked: mealEntries.dateCooked })
			.from(mealEntries)
			.where(
				and(
					eq(mealEntries.userId, userId),
					gte(mealEntries.dateCooked, toDateString(startDate)),
					lte(mealEntries.dateCooked, toDateString(endDate))
				)
			);

		return [...new Set(entries.map((e) => e.dateCooked))];
	}

	/**
	 * Create a new entry. Throws NotFoundError if the meal is missing or not the user's.
	 */
	static async createEntry(userId: string, data: EntryData): Promise<EntryWithMeal> {
		if (!isUuid(data.mealId)) throw new NotFoundError('Meal');
		await assertOwnPhotoUrls(userId, data.photoUrls ?? []);

		return db.transaction(async (tx) => {
			await assertOwnMeal(tx, userId, data.mealId);

			const [newEntry] = await tx
				.insert(mealEntries)
				.values({
					userId,
					mealId: data.mealId,
					dateCooked: toDateString(data.dateCooked),
					notes: data.notes || null,
					photoUrls: data.photoUrls || []
				})
				.returning();

			const [created] = await withMeals(tx, userId, [newEntry]);
			return created;
		});
	}

	/**
	 * Update an entry. Throws NotFoundError if the entry or the new meal is missing or not
	 * the user's.
	 */
	static async updateEntry(
		entryId: string,
		userId: string,
		data: Partial<EntryData>
	): Promise<EntryWithMeal> {
		if (!isUuid(entryId)) throw new NotFoundError('Entry');
		if (data.mealId !== undefined && !isUuid(data.mealId)) throw new NotFoundError('Meal');
		await assertOwnPhotoUrls(userId, data.photoUrls ?? []);

		const { entry, removed } = await db.transaction(async (tx) => {
			const [existing] = await tx
				.select()
				.from(mealEntries)
				.where(and(eq(mealEntries.id, entryId), eq(mealEntries.userId, userId)))
				.for('update');
			if (!existing) throw new NotFoundError('Entry');

			if (data.mealId !== undefined) await assertOwnMeal(tx, userId, data.mealId);

			const updateData: Partial<typeof mealEntries.$inferInsert> = { updatedAt: new Date() };
			if (data.mealId !== undefined) updateData.mealId = data.mealId;
			if (data.dateCooked !== undefined) updateData.dateCooked = toDateString(data.dateCooked);
			if (data.notes !== undefined) updateData.notes = data.notes;
			if (data.photoUrls !== undefined) updateData.photoUrls = data.photoUrls;

			const [updated] = await tx
				.update(mealEntries)
				.set(updateData)
				.where(eq(mealEntries.id, entryId))
				.returning();

			const [result] = await withMeals(tx, userId, [updated]);
			if (!result) throw new NotFoundError('Meal');
			return {
				entry: result,
				removed: removedUrls(existing.photoUrls ?? [], updated.photoUrls ?? [])
			};
		});

		await FileService.deleteUnreferenced(removed);
		return entry;
	}

	/**
	 * Delete an entry. Throws NotFoundError if it is missing or not the user's.
	 */
	static async deleteEntry(entryId: string, userId: string): Promise<void> {
		if (!isUuid(entryId)) throw new NotFoundError('Entry');

		const [deleted] = await db
			.delete(mealEntries)
			.where(and(eq(mealEntries.id, entryId), eq(mealEntries.userId, userId)))
			.returning();
		if (!deleted) throw new NotFoundError('Entry');

		await FileService.deleteUnreferenced(deleted.photoUrls ?? []);
	}

	/**
	 * Get entries for a specific meal (when cooked)
	 */
	static async getEntriesByMealId(userId: string, mealId: string): Promise<EntryWithMeal[]> {
		if (!isUuid(mealId)) return [];

		const entries = await db
			.select()
			.from(mealEntries)
			.where(and(eq(mealEntries.userId, userId), eq(mealEntries.mealId, mealId)))
			.orderBy(desc(mealEntries.dateCooked));
		return withMeals(db, userId, entries);
	}
}
