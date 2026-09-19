import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { SettingsService } from '$lib/server/services/settings.service';
import { CategoryService } from '$lib/server/services/category.service';
import { actionError, parseForm } from '$lib/server/api';
import { formText, settingsFormSchema } from '$lib/schemas';

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
		const parsed = parseForm(
			{
				suggestionDaysThreshold: formText(formData, 'daysThreshold') ?? '14',
				suggestionUseDayOfWeek: formData.get('useDayOfWeek') === 'true',
				suggestionExcludedCategoryIds: formText(formData, 'excludedCategoryIds') ?? '[]'
			},
			settingsFormSchema
		);
		if (!parsed.ok) return parsed.failure;

		try {
			await SettingsService.updateSettings(locals.user.id, parsed.data);
			return { success: true };
		} catch (error) {
			return actionError(error, 'Failed to update settings');
		}
	}
};
