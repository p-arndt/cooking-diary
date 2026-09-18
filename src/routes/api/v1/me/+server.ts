import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = requireUser(locals);
	return json({ id: user.id, name: user.name, email: user.email, image: user.image ?? null });
};
