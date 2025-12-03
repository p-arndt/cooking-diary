import { redirect, error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { MealService } from '$lib/server/services/meal.service';
import { CategoryService } from '$lib/server/services/category.service';
import { FileService } from '$lib/server/services/file.service';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const meal = await MealService.getMealById(params.id, locals.user.id);

	if (!meal) {
		throw error(404, 'Meal not found');
	}

	const categories = await CategoryService.getCategoriesByUserId(locals.user.id);

	return {
		user: locals.user,
		meal,
		categories
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString();
		const defaultNotes = formData.get('defaultNotes')?.toString() || null;
		const defaultPhotoUrl = formData.get('defaultPhotoUrl')?.toString() || null;
		const categoryIdsStr = formData.get('categoryIds')?.toString() || '[]';
		const photoFile = formData.get('photo') as File | null;

		let categoryIds: string[] = [];
		try {
			categoryIds = JSON.parse(categoryIdsStr);
		} catch {
			categoryIds = [];
		}

		if (!title) {
			return fail(400, { error: 'Title is required' });
		}

		let finalPhotoUrl = defaultPhotoUrl || null;

		if (photoFile && photoFile.size > 0) {
			try {
				finalPhotoUrl = await FileService.saveFile(photoFile);
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
				return fail(400, { error: errorMessage });
			}
		}

		try {
			const meal = await MealService.updateMeal(params.id, locals.user.id, {
				title,
				defaultNotes,
				defaultPhotoUrl: finalPhotoUrl,
				categoryIds
			});

			if (!meal) {
				return fail(404, { error: 'Meal not found' });
			}

			return { success: true, mealId: meal.id };
		} catch (error) {
			console.error('Error updating meal:', error);
			return fail(500, { error: 'Failed to update meal' });
		}
	}
};

