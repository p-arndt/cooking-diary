import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { MealService } from '$lib/server/services/meal.service';
import { CategoryService } from '$lib/server/services/category.service';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const search = url.searchParams.get('search') || '';
	const categoryIds = url.searchParams.getAll('category');

	let meals;
	if (search) {
		meals = await MealService.searchMeals(locals.user.id, search);
	} else if (categoryIds.length > 0) {
		meals = await MealService.getMealsByCategories(locals.user.id, categoryIds);
	} else {
		meals = await MealService.getMealsByUserId(locals.user.id);
	}

	const categories = await CategoryService.getCategoriesByUserId(locals.user.id);

	return {
		user: locals.user,
		meals,
		categories,
		search,
		categoryId: categoryIds[0] || null
	};
};

