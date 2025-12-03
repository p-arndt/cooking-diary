import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { MealService } from '$lib/server/services/meal.service';
import { CategoryService } from '$lib/server/services/category.service';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const search = url.searchParams.get('search') || '';
	const categoryId = url.searchParams.get('category');

	let meals;
	if (search) {
		meals = await MealService.searchMeals(locals.user.id, search);
	} else if (categoryId) {
		meals = await MealService.getMealsByCategory(locals.user.id, categoryId);
	} else {
		meals = await MealService.getMealsByUserId(locals.user.id);
	}

	const categories = await CategoryService.getCategoriesByUserId(locals.user.id);

	return {
		user: locals.user,
		meals,
		categories,
		search,
		categoryId
	};
};

