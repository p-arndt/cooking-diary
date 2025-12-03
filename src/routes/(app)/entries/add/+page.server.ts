import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { MealService } from '$lib/server/services/meal.service';
import { EntryService } from '$lib/server/services/entry.service';
import { FileService } from '$lib/server/services/file.service';
import type { EntryWithMeal } from '$lib/server/services/entry.service';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const step = parseInt(url.searchParams.get('step') || '1');
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
		const mealId = formData.get('mealId')?.toString();
		const dateCooked = formData.get('dateCooked')?.toString();
		const notes = formData.get('notes')?.toString() || null;
		const photoUrlsStr = formData.get('photoUrls')?.toString() || '[]';

		let photoUrls: string[] = [];
		try {
			photoUrls = JSON.parse(photoUrlsStr);
		} catch {
			photoUrls = [];
		}

		// Handle file uploads
		const photoFiles = formData.getAll('photos') as File[];
		if (photoFiles.length > 0) {
			try {
				const validFiles = photoFiles.filter((f) => f.size > 0);
				const uploadedUrls = await Promise.all(
					validFiles.map((file) => FileService.saveFile(file))
				);
				photoUrls = [...photoUrls, ...uploadedUrls];
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
				return fail(400, { error: errorMessage });
			}
		}

		if (!mealId || !dateCooked) {
			return fail(400, { error: 'Missing required fields' });
		}

		try {
			const entry = await EntryService.createEntry(locals.user.id, {
				mealId,
				dateCooked: new Date(dateCooked),
				notes,
				photoUrls
			});
			return { success: true, entryId: entry.id };
		} catch (error) {
			console.error('Error creating entry:', error);
			return fail(500, { error: 'Failed to create entry' });
		}
	}
};

