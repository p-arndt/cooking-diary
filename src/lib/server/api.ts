import { error, fail, json, type ActionFailure } from '@sveltejs/kit';
import { z } from 'zod';
import { formatIssues } from '$lib/schemas';
import { InvalidInputError, NotFoundError } from '$lib/server/services/errors';

export function requireUser(locals: App.Locals) {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	return locals.user;
}

export async function parseBody<T extends z.ZodType>(
	request: Request,
	schema: T
): Promise<z.infer<T>> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}
	return parseInput(body, schema);
}

/** Parses already-extracted input (query params, form fields), failing with a 400. */
export function parseInput<T extends z.ZodType>(input: unknown, schema: T): z.infer<T> {
	const result = schema.safeParse(input);
	if (!result.success) {
		throw error(400, formatIssues(result.error));
	}
	return result.data;
}

export function notFound(what: string) {
	return json({ error: `${what} not found` }, { status: 404 });
}

/** Maps the services' typed errors to the JSON responses API clients expect. */
export function apiError(err: unknown): Response {
	if (err instanceof NotFoundError) return notFound(err.entity);
	if (err instanceof InvalidInputError) return json({ error: err.message }, { status: 400 });
	throw err;
}

/** Maps the services' typed errors to form action failures. */
export function actionError(err: unknown, fallbackMessage: string) {
	if (err instanceof NotFoundError) return fail(404, { error: err.message });
	if (err instanceof InvalidInputError) return fail(400, { error: err.message });
	console.error(`${fallbackMessage}:`, err);
	return fail(500, { error: fallbackMessage });
}

/** Validates form input for an action; `ok: false` carries the 400 to return. */
export function parseForm<T extends z.ZodType>(
	input: unknown,
	schema: T
): { ok: true; data: z.infer<T> } | { ok: false; failure: ActionFailure<{ error: string }> } {
	const result = schema.safeParse(input);
	return result.success
		? { ok: true, data: result.data }
		: { ok: false, failure: fail(400, { error: formatIssues(result.error) }) };
}
