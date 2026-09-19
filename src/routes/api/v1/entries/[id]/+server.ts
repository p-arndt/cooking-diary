import { json } from '@sveltejs/kit';
import { apiError, parseBody, requireUser } from '$lib/server/api';
import { entryUpdateSchema } from '$lib/schemas';
import { EntryService } from '$lib/server/services/entry.service';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	const user = requireUser(locals);
	const body = await parseBody(request, entryUpdateSchema);
	try {
		return json(await EntryService.updateEntry(params.id, user.id, body));
	} catch (err) {
		return apiError(err);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = requireUser(locals);
	try {
		await EntryService.deleteEntry(params.id, user.id);
		return new Response(null, { status: 204 });
	} catch (err) {
		return apiError(err);
	}
};
