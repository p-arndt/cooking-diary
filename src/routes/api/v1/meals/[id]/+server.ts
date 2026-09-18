import { json } from '@sveltejs/kit';
import { mealSchema, notFound, parseBody, requireUser } from '$lib/server/api';
import { EntryService } from '$lib/server/services/entry.service';
import { MealService } from '$lib/server/services/meal.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	const user = requireUser(locals);
	const meal = await MealService.getMealById(params.id, user.id);
	if (!meal) return notFound('Meal');

	const entries = await EntryService.getEntriesByMealId(user.id, meal.id);
	return json({ ...meal, entries });
};

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	const user = requireUser(locals);
	const body = await parseBody(request, mealSchema.partial());
	const updated = await MealService.updateMeal(params.id, user.id, body);
	return updated ? json(updated) : notFound('Meal');
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = requireUser(locals);
	const deleted = await MealService.deleteMeal(params.id, user.id);
	return deleted ? new Response(null, { status: 204 }) : notFound('Meal');
};
