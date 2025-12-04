import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { SettingsService } from '$lib/server/services/settings.service';
import { CategoryService } from '$lib/server/services/category.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const [settings, categories] = await Promise.all([
		SettingsService.getSettings(locals.user.id),
		CategoryService.getCategoriesByUserId(locals.user.id)
	]);

	return {
		user: locals.user,
		settings,
		categories
	};
};

export const actions: Actions = {
	updateSuggestionSettings: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const daysThreshold = parseInt(formData.get('daysThreshold')?.toString() || '14');
		const useDayOfWeek = formData.get('useDayOfWeek') === 'true';
		const excludedCategoryIdsStr = formData.get('excludedCategoryIds')?.toString() || '[]';

		let excludedCategoryIds: string[] = [];
		try {
			excludedCategoryIds = JSON.parse(excludedCategoryIdsStr);
		} catch {
			excludedCategoryIds = [];
		}

		try {
			// Partial update - only updates provided fields
			await SettingsService.updateSettings(locals.user.id, {
				suggestionDaysThreshold: daysThreshold,
				suggestionUseDayOfWeek: useDayOfWeek,
				suggestionExcludedCategoryIds: excludedCategoryIds
			});

			return { success: true };
		} catch (error) {
			console.error('Error updating settings:', error);
			return fail(500, { error: 'Failed to update settings' });
		}
	}
};

