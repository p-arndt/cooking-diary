import { json } from '@sveltejs/kit';
import { apiError, parseBody, requireUser } from '$lib/server/api';
import { categorySchema } from '$lib/schemas';
import { CategoryService } from '$lib/server/services/category.service';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	const user = requireUser(locals);
	const { name } = await parseBody(request, categorySchema);
	try {
		return json(await CategoryService.updateCategory(params.id, user.id, name));
	} catch (err) {
		return apiError(err);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = requireUser(locals);
	try {
		await CategoryService.deleteCategory(params.id, user.id);
		return new Response(null, { status: 204 });
	} catch (err) {
		return apiError(err);
	}
};
