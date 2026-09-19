import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { MealService } from '$lib/server/services/meal.service';
import { EntryService } from '$lib/server/services/entry.service';
import { FileService, FileValidationError } from '$lib/server/services/file.service';
import { actionError, parseForm } from '$lib/server/api';
import { entryFormSchema, formText, MAX_ENTRY_PHOTOS } from '$lib/schemas';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const step = parseInt(url.searchParams.get('step') || '1') || 1;
	const dateParam = url.searchParams.get('date');
	const mealId = url.searchParams.get('mealId');

	// Get recent meals for step 2
	const recentMeals = await MealService.getRecentMeals(locals.user.id, 10);

	// Get all meals for step 2
	const allMeals = await MealService.getMealsByUserId(locals.user.id);

	return {
		user: locals.user,
		step: Math.max(1, Math.min(3, step)),
		date: dateParam || null,
		mealId: mealId || null,
		recentMeals,
		allMeals
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const parsed = parseForm(
			{
				mealId: formText(formData, 'mealId'),
				dateCooked: formText(formData, 'dateCooked'),
				notes: formText(formData, 'notes'),
				photoUrls: formText(formData, 'photoUrls') ?? '[]'
			},
			entryFormSchema
		);
		if (!parsed.ok) return parsed.failure;

		const photoFiles = formData
			.getAll('photos')
			.filter((value): value is File => value instanceof File && value.size > 0);
		if (parsed.data.photoUrls.length + photoFiles.length > MAX_ENTRY_PHOTOS) {
			return fail(400, { error: `At most ${MAX_ENTRY_PHOTOS} photos per entry` });
		}

		let uploadedUrls: string[];
		try {
			uploadedUrls = await FileService.saveFiles(photoFiles, locals.user.id);
		} catch (error: unknown) {
			if (error instanceof FileValidationError) return fail(400, { error: error.message });
			console.error('Error uploading images:', error);
			return fail(500, { error: 'Failed to upload images' });
		}

		try {
			const entry = await EntryService.createEntry(locals.user.id, {
				...parsed.data,
				photoUrls: [...parsed.data.photoUrls, ...uploadedUrls]
			});
			return { success: true, entryId: entry.id };
		} catch (error) {
			return actionError(error, 'Failed to create entry');
		}
	}
};
