import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { MealService } from '$lib/server/services/meal.service';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const meal = await MealService.getMealById(params.id, locals.user.id);

	if (!meal) {
		throw error(404, 'Meal not found');
	}

	return {
		user: locals.user,
		meal
	};
};

