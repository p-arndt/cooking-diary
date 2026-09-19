import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { CategoryService } from '$lib/server/services/category.service';
import { actionError, parseForm } from '$lib/server/api';
import { categoryIdSchema, categorySchema, categoryUpdateSchema, formText } from '$lib/schemas';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const categories = await CategoryService.getCategoriesWithMealsByUserId(locals.user.id);

	return {
		user: locals.user,
		categories
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const parsed = parseForm({ name: formText(formData, 'name') }, categorySchema);
		if (!parsed.ok) return parsed.failure;

		try {
			const category = await CategoryService.createCategory(locals.user.id, parsed.data.name);
			return { success: true, category };
		} catch (error) {
			return actionError(error, 'Failed to create category');
		}
	},

	edit: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const parsed = parseForm(
			{ id: formText(formData, 'id'), name: formText(formData, 'name') },
			categoryUpdateSchema
		);
		if (!parsed.ok) return parsed.failure;

		try {
			const category = await CategoryService.updateCategory(
				parsed.data.id,
				locals.user.id,
				parsed.data.name
			);
			return { success: true, category };
		} catch (error) {
			return actionError(error, 'Failed to update category');
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const parsed = parseForm({ id: formText(formData, 'id') }, categoryIdSchema);
		if (!parsed.ok) return parsed.failure;

		try {
			await CategoryService.deleteCategory(parsed.data.id, locals.user.id);
			return { success: true };
		} catch (error) {
			return actionError(error, 'Failed to delete category');
		}
	}
};
