import { json } from '@sveltejs/kit';
import { parseBody, requireUser } from '$lib/server/api';
import { categorySchema } from '$lib/schemas';
import { CategoryService } from '$lib/server/services/category.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = requireUser(locals);
	return json({ categories: await CategoryService.getCategoriesWithMealsByUserId(user.id) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = requireUser(locals);
	const { name } = await parseBody(request, categorySchema);
	return json(await CategoryService.createCategory(user.id, name), { status: 201 });
};
