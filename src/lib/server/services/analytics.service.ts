import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export type DayOfWeekPattern = {
	dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
	dayName: string;
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
					dayName: DAY_NAMES[dayOfWeek],
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
		topCategoriesByDay: Record<string, { categoryName: string; count: number }[]>;
		totalEntriesAnalyzed: number;
	}> {
		const patterns = await this.getCategoryDayOfWeekPatterns(userId);

		const topCategoriesByDay: Record<string, { categoryName: string; count: number }[]> = {};

		for (const dayName of DAY_NAMES) {
			const dayPatterns = patterns
				.filter((p) => p.dayName === dayName)
				.slice(0, 3)
				.map((p) => ({
					categoryName: p.categoryName,
					count: p.count
				}));
			topCategoriesByDay[dayName] = dayPatterns;
		}

		const totalEntriesAnalyzed = patterns.reduce((sum, p) => sum + p.count, 0);

		return {
			topCategoriesByDay,
			totalEntriesAnalyzed
		};
	}
}

