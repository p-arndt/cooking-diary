import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export type DayOfWeekPattern = {
	dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
	dayName: string; // Deprecated: kept for backward compatibility, now contains dayOfWeek as string
	categoryId: string;
	categoryName: string;
	count: number;
	percentage: number;
};

export type CategoryPatternSummary = {
	categoryId: string;
	categoryName: string;
	topDays: { dayOfWeek: number; dayName: string; count: number }[];
	totalCount: number;
};

export class AnalyticsService {
	/**
	 * Get which categories are most commonly cooked on each day of the week
	 */
	static async getCategoryDayOfWeekPatterns(userId: string): Promise<DayOfWeekPattern[]> {
		try {
			const result = await db.execute(sql`
				SELECT 
					EXTRACT(DOW FROM me.date_cooked::date) as day_of_week,
					c.id as category_id,
					c.name as category_name,
					COUNT(*) as count
				FROM meal_entries me
				INNER JOIN meal_to_categories mtc ON mtc.meal_id = me.meal_id
				INNER JOIN categories c ON c.id = mtc.category_id
				WHERE me.user_id = ${userId}
				GROUP BY EXTRACT(DOW FROM me.date_cooked::date), c.id, c.name
				ORDER BY day_of_week, count DESC
			`);

			const rows = Array.isArray(result) ? result : [];
			if (rows.length === 0) return [];

			const patterns: DayOfWeekPattern[] = [];
			const dayTotals = new Map<number, number>();

			for (const row of rows) {
				const r = row as Record<string, unknown>;
				const dayOfWeek = parseInt(String(r.day_of_week));
				const count = parseInt(String(r.count));
				dayTotals.set(dayOfWeek, (dayTotals.get(dayOfWeek) || 0) + count);
			}

			for (const row of rows) {
				const r = row as Record<string, unknown>;
				const dayOfWeek = parseInt(String(r.day_of_week));
				const count = parseInt(String(r.count));
				const total = dayTotals.get(dayOfWeek) || 1;

				patterns.push({
					dayOfWeek,
					dayName: dayOfWeek.toString(),
					categoryId: String(r.category_id),
					categoryName: String(r.category_name),
					count,
					percentage: Math.round((count / total) * 100)
				});
			}

			return patterns;
		} catch (error) {
			console.error('Error getting category day of week patterns:', error);
			return [];
		}
	}

	/**
	 * Get top categories for a specific day of the week
	 */
	static async getTopCategoriesForDay(
		userId: string,
		dayOfWeek: number,
		limit: number = 5
	): Promise<{ categoryId: string; categoryName: string; count: number }[]> {
		try {
			const result = await db.execute(sql`
				SELECT 
					c.id as category_id,
					c.name as category_name,
					COUNT(*) as count
				FROM meal_entries me
				INNER JOIN meal_to_categories mtc ON mtc.meal_id = me.meal_id
				INNER JOIN categories c ON c.id = mtc.category_id
				WHERE me.user_id = ${userId}
					AND EXTRACT(DOW FROM me.date_cooked::date) = ${dayOfWeek}
				GROUP BY c.id, c.name
				ORDER BY count DESC
				LIMIT ${limit}
			`);

			const rows = Array.isArray(result) ? result : [];
			if (rows.length === 0) return [];

			return rows.map((row) => {
				const r = row as Record<string, unknown>;
				return {
					categoryId: String(r.category_id),
					categoryName: String(r.category_name),
					count: parseInt(String(r.count))
				};
			});
		} catch (error) {
			console.error('Error getting top categories for day:', error);
			return [];
		}
	}

	/**
	 * Get meals that match the user's patterns for the current day
	 */
	static async getMealsForDayOfWeekPattern(
		userId: string,
		dayOfWeek?: number
	): Promise<string[]> {
		try {
			const targetDay = dayOfWeek ?? new Date().getDay();

			const topCategories = await this.getTopCategoriesForDay(userId, targetDay, 3);

			if (topCategories.length === 0) {
				return [];
			}

			const categoryIds = topCategories.map((c) => c.categoryId);

			const result = await db.execute(sql`
				SELECT DISTINCT m.id as meal_id
				FROM meals m
				INNER JOIN meal_to_categories mtc ON mtc.meal_id = m.id
				WHERE m.user_id = ${userId}
					AND mtc.category_id = ANY(${categoryIds})
			`);

			const rows = Array.isArray(result) ? result : [];
			if (rows.length === 0) return [];

			return rows.map((row) => {
				const r = row as Record<string, unknown>;
				return String(r.meal_id);
			});
		} catch (error) {
			console.error('Error getting meals for day of week pattern:', error);
			return [];
		}
	}

	/**
	 * Get a summary of cooking patterns for the user
	 */
	static async getCookingPatternsSummary(userId: string): Promise<{
		topCategoriesByDay: Record<number, { categoryName: string; count: number }[]>;
		totalEntriesAnalyzed: number;
	}> {
		const patterns = await this.getCategoryDayOfWeekPatterns(userId);

		const topCategoriesByDay: Record<number, { categoryName: string; count: number }[]> = {};

		for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
			const dayPatterns = patterns
				.filter((p) => p.dayOfWeek === dayOfWeek)
				.slice(0, 3)
				.map((p) => ({
					categoryName: p.categoryName,
					count: p.count
				}));
			topCategoriesByDay[dayOfWeek] = dayPatterns;
		}

		const totalEntriesAnalyzed = patterns.reduce((sum, p) => sum + p.count, 0);

		return {
			topCategoriesByDay,
			totalEntriesAnalyzed
		};
	}

	/**
	 * Get general statistics for the user
	 */
	static async getGeneralStatistics(userId: string): Promise<{
		totalEntries: number;
		totalMeals: number;
		totalCategories: number;
		entriesWithPhotos: number;
		entriesWithNotes: number;
		firstEntryDate: Date | null;
		lastEntryDate: Date | null;
		averageEntriesPerWeek: number;
		mostActiveDay: number | null;
	}> {
		try {
			const [entriesStats, mealsCount, categoriesCount, entriesData] = await Promise.all([
				db.execute(sql`
					SELECT 
						COUNT(*)::int as total,
						COUNT(CASE WHEN photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0 THEN 1 END)::int as with_photos,
						COUNT(CASE WHEN notes IS NOT NULL AND notes != '' THEN 1 END)::int as with_notes,
						MIN(date_cooked)::date as first_date,
						MAX(date_cooked)::date as last_date
					FROM meal_entries
					WHERE user_id = ${userId}
				`),
				db.execute(sql`
					SELECT COUNT(*)::int as total
					FROM meals
					WHERE user_id = ${userId}
				`),
				db.execute(sql`
					SELECT COUNT(DISTINCT c.id)::int as total
					FROM categories c
					WHERE c.user_id = ${userId}
				`),
				db.execute(sql`
					SELECT 
						EXTRACT(DOW FROM date_cooked::date)::int as day_of_week,
						COUNT(*)::int as count
					FROM meal_entries
					WHERE user_id = ${userId}
					GROUP BY EXTRACT(DOW FROM date_cooked::date)
					ORDER BY count DESC
					LIMIT 1
				`)
			]);

			const entriesResult = Array.isArray(entriesStats) ? entriesStats : [entriesStats];
			const mealsResult = Array.isArray(mealsCount) ? mealsCount : [mealsCount];
			const categoriesResult = Array.isArray(categoriesCount) ? categoriesCount : [categoriesCount];
			const dayResult = Array.isArray(entriesData) ? entriesData : entriesData ? [entriesData] : [];

			const e = (entriesResult[0] || {}) as Record<string, unknown>;
			const m = (mealsResult[0] || {}) as Record<string, unknown>;
			const c = (categoriesResult[0] || {}) as Record<string, unknown>;
			const d = (dayResult[0] || {}) as Record<string, unknown> | undefined;

			const totalEntries = parseInt(String(e.total || 0));
			const firstDate = e.first_date ? new Date(String(e.first_date)) : null;
			const lastDate = e.last_date ? new Date(String(e.last_date)) : null;

			let averageEntriesPerWeek = 0;
			if (firstDate && lastDate && totalEntries > 0) {
				const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
				const weeks = daysDiff / 7;
				averageEntriesPerWeek = weeks > 0 ? Math.round((totalEntries / weeks) * 10) / 10 : 0;
			}

			const mostActiveDay = d ? parseInt(String(d.day_of_week)) : null;

			return {
				totalEntries,
				totalMeals: parseInt(String(m.total || 0)),
				totalCategories: parseInt(String(c.total || 0)),
				entriesWithPhotos: parseInt(String(e.with_photos || 0)),
				entriesWithNotes: parseInt(String(e.with_notes || 0)),
				firstEntryDate: firstDate,
				lastEntryDate: lastDate,
				averageEntriesPerWeek,
				mostActiveDay
			};
		} catch (error) {
			console.error('Error getting general statistics:', error);
			return {
				totalEntries: 0,
				totalMeals: 0,
				totalCategories: 0,
				entriesWithPhotos: 0,
				entriesWithNotes: 0,
				firstEntryDate: null,
				lastEntryDate: null,
				averageEntriesPerWeek: 0,
				mostActiveDay: null
			};
		}
	}

	/**
	 * Get top meals by entry count
	 */
	static async getTopMeals(userId: string, limit: number = 10): Promise<
		Array<{
			mealId: string;
			mealTitle: string;
			count: number;
		}>
	> {
		try {
			const result = await db.execute(sql`
				SELECT 
					m.id as meal_id,
					m.title as meal_title,
					COUNT(*) as count
				FROM meal_entries me
				INNER JOIN meals m ON m.id = me.meal_id
				WHERE me.user_id = ${userId}
				GROUP BY m.id, m.title
				ORDER BY count DESC
				LIMIT ${limit}
			`);

			const rows = Array.isArray(result) ? result : [];
			return rows.map((row) => {
				const r = row as Record<string, unknown>;
				return {
					mealId: String(r.meal_id),
					mealTitle: String(r.meal_title),
					count: parseInt(String(r.count))
				};
			});
		} catch (error) {
			console.error('Error getting top meals:', error);
			return [];
		}
	}

	/**
	 * Get category usage statistics
	 */
	static async getCategoryStatistics(userId: string): Promise<
		Array<{
			categoryId: string;
			categoryName: string;
			entryCount: number;
			mealCount: number;
		}>
	> {
		try {
			const result = await db.execute(sql`
				SELECT 
					c.id as category_id,
					c.name as category_name,
					COUNT(DISTINCT me.id) as entry_count,
					COUNT(DISTINCT m.id) as meal_count
				FROM categories c
				LEFT JOIN meal_to_categories mtc ON mtc.category_id = c.id
				LEFT JOIN meals m ON m.id = mtc.meal_id AND m.user_id = ${userId}
				LEFT JOIN meal_entries me ON me.meal_id = m.id AND me.user_id = ${userId}
				WHERE c.user_id = ${userId}
				GROUP BY c.id, c.name
				ORDER BY entry_count DESC, meal_count DESC
			`);

			const rows = Array.isArray(result) ? result : [];
			return rows.map((row) => {
				const r = row as Record<string, unknown>;
				return {
					categoryId: String(r.category_id),
					categoryName: String(r.category_name),
					entryCount: parseInt(String(r.entry_count || 0)),
					mealCount: parseInt(String(r.meal_count || 0))
				};
			});
		} catch (error) {
			console.error('Error getting category statistics:', error);
			return [];
		}
	}

	/**
	 * Get entries per month for the last 12 months
	 */
	static async getMonthlyStatistics(userId: string): Promise<
		Array<{
			year: number;
			month: number;
			count: number;
		}>
	> {
		try {
			const result = await db.execute(sql`
				SELECT 
					EXTRACT(YEAR FROM date_cooked::date) as year,
					EXTRACT(MONTH FROM date_cooked::date) as month,
					COUNT(*) as count
				FROM meal_entries
				WHERE user_id = ${userId}
					AND date_cooked >= CURRENT_DATE - INTERVAL '12 months'
				GROUP BY EXTRACT(YEAR FROM date_cooked::date), EXTRACT(MONTH FROM date_cooked::date)
				ORDER BY year DESC, month DESC
				LIMIT 12
			`);

			const rows = Array.isArray(result) ? result : [];
			return rows.map((row) => {
				const r = row as Record<string, unknown>;
				return {
					year: parseInt(String(r.year)),
					month: parseInt(String(r.month)),
					count: parseInt(String(r.count))
				};
			});
		} catch (error) {
			console.error('Error getting monthly statistics:', error);
			return [];
		}
	}
}

