import { json } from '@sveltejs/kit';
import { mealSchema, parseBody, requireUser } from '$lib/server/api';
import { MealService } from '$lib/server/services/meal.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = requireUser(locals);
	const query = url.searchParams.get('q')?.trim();
	const meals = query
		? await MealService.searchMeals(user.id, query)
		: await MealService.getMealsByUserId(user.id);
	return json({ meals });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = requireUser(locals);
	const body = await parseBody(request, mealSchema);
	return json(await MealService.createMeal(user.id, body), { status: 201 });
};
