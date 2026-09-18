import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api';
import { AnalyticsService } from '$lib/server/services/analytics.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = requireUser(locals);
	const [general, topMeals, categories, monthly] = await Promise.all([
		AnalyticsService.getGeneralStatistics(user.id),
		AnalyticsService.getTopMeals(user.id, 10),
		AnalyticsService.getCategoryStatistics(user.id),
		AnalyticsService.getMonthlyStatistics(user.id)
	]);
	return json({ general, topMeals, categories, monthly });
};
