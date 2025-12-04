import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { CategoryService } from '$lib/server/services/category.service';

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
		const name = formData.get('name')?.toString();

		if (!name || !name.trim()) {
			return fail(400, { error: 'Name is required' });
		}

		try {
			const category = await CategoryService.createCategory(locals.user.id, name.trim());
			return { success: true, category };
		} catch (error) {
			console.error('Error creating category:', error);
			return fail(500, { error: 'Failed to create category' });
		}
	},

	edit: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const name = formData.get('name')?.toString();

		if (!id || !name || !name.trim()) {
			return fail(400, { error: 'ID and name are required' });
		}

		try {
			const category = await CategoryService.updateCategory(id, locals.user.id, name.trim());

			if (!category) {
				return fail(404, { error: 'Category not found' });
			}

			return { success: true, category };
		} catch (error) {
			console.error('Error updating category:', error);
			return fail(500, { error: 'Failed to update category' });
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		try {
			const success = await CategoryService.deleteCategory(id, locals.user.id);

			if (!success) {
				return fail(404, { error: 'Category not found' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error deleting category:', error);
			return fail(500, { error: 'Failed to delete category' });
		}
	}
};

