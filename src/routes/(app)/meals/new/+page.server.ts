import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { CategoryService } from '$lib/server/services/category.service';
import { MealService } from '$lib/server/services/meal.service';
import { FileService } from '$lib/server/services/file.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const categories = await CategoryService.getCategoriesByUserId(locals.user.id);

	return {
		user: locals.user,
		categories
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString();
		const defaultNotes = formData.get('defaultNotes')?.toString() || null;
		const categoryIdsStr = formData.get('categoryIds')?.toString() || '[]';
		const photoFile = formData.get('photo') as File | null;
		const prepTime = formData.get('prepTime')?.toString() || null;
		const cookTime = formData.get('cookTime')?.toString() || null;
		const difficulty = formData.get('difficulty')?.toString() || null;

		let categoryIds: string[] = [];
		try {
			categoryIds = JSON.parse(categoryIdsStr);
		} catch {
			categoryIds = [];
		}

		if (!title) {
			return fail(400, { error: 'Title is required' });
		}

		let finalPhotoUrl: string | null = null;

		if (photoFile && photoFile.size > 0) {
			try {
				finalPhotoUrl = await FileService.saveFile(photoFile);
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
				return fail(400, { error: errorMessage });
			}
		}

		try {
			const meal = await MealService.createMeal(locals.user.id, {
				title,
				defaultNotes,
				defaultPhotoUrl: finalPhotoUrl,
				prepTime,
				cookTime,
				difficulty,
				categoryIds
			});
			return { success: true, mealId: meal.id };
		} catch (error) {
			console.error('Error creating meal:', error);
			return fail(500, { error: 'Failed to create meal' });
		}
	}
};

