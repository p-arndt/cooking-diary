import { redirect, error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { MealService } from '$lib/server/services/meal.service';
import { CategoryService } from '$lib/server/services/category.service';
import { FileService, FileValidationError } from '$lib/server/services/file.service';
import { actionError, parseForm } from '$lib/server/api';
import { formText, mealFormSchema } from '$lib/schemas';

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
		const parsed = parseForm(
			{
				title: formText(formData, 'title'),
				defaultNotes: formText(formData, 'defaultNotes'),
				defaultPhotoUrl: formText(formData, 'defaultPhotoUrl'),
				prepTime: formText(formData, 'prepTime'),
				cookTime: formText(formData, 'cookTime'),
				difficulty: formText(formData, 'difficulty'),
				categoryIds: formText(formData, 'categoryIds') ?? '[]'
			},
			mealFormSchema
		);
		if (!parsed.ok) return parsed.failure;

		let defaultPhotoUrl = parsed.data.defaultPhotoUrl ?? null;
		const photoFile = formData.get('photo');
		if (photoFile instanceof File && photoFile.size > 0) {
			try {
				defaultPhotoUrl = await FileService.saveFile(photoFile, locals.user.id);
			} catch (error: unknown) {
				if (error instanceof FileValidationError) return fail(400, { error: error.message });
				console.error('Error uploading image:', error);
				return fail(500, { error: 'Failed to upload image' });
			}
		}

		try {
			const meal = await MealService.updateMeal(params.id, locals.user.id, {
				...parsed.data,
				defaultPhotoUrl
			});
			return { success: true, mealId: meal.id };
		} catch (error) {
			return actionError(error, 'Failed to update meal');
		}
	}
};
