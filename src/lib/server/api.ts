import { error, json } from '@sveltejs/kit';
import { z } from 'zod';

export function requireUser(locals: App.Locals) {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	return locals.user;
}

export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}
	const result = schema.safeParse(body);
	if (!result.success) {
		throw error(400, result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '));
	}
	return result.data;
}

export function notFound(what: string) {
	return json({ error: `${what} not found` }, { status: 404 });
}

/** Dates in `YYYY-MM-DD`, the format the mobile client sends and receives. */
export const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export const mealSchema = z.object({
	title: z.string().trim().min(1),
	defaultNotes: z.string().nullish(),
	defaultPhotoUrl: z.string().nullish(),
	prepTime: z.string().nullish(),
	cookTime: z.string().nullish(),
	difficulty: z.enum(['easy', 'medium', 'hard']).nullish(),
	categoryIds: z.array(z.uuid()).optional()
});

export const categorySchema = z.object({ name: z.string().trim().min(1) });
