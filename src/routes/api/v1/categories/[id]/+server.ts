import { json } from '@sveltejs/kit';
import { categorySchema, notFound, parseBody, requireUser } from '$lib/server/api';
import { CategoryService } from '$lib/server/services/category.service';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	const user = requireUser(locals);
	const { name } = await parseBody(request, categorySchema);
	const updated = await CategoryService.updateCategory(params.id, user.id, name);
	return updated ? json(updated) : notFound('Category');
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = requireUser(locals);
	const deleted = await CategoryService.deleteCategory(params.id, user.id);
	return deleted ? new Response(null, { status: 204 }) : notFound('Category');
};
