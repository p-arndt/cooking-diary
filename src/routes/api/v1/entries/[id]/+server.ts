import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { isoDate, notFound, parseBody, requireUser } from '$lib/server/api';
import { EntryService } from '$lib/server/services/entry.service';
import type { RequestHandler } from './$types';

const updateSchema = z.object({
	mealId: z.uuid().optional(),
	dateCooked: z.string().regex(isoDate).optional(),
	notes: z.string().nullish(),
	photoUrls: z.array(z.string()).optional()
});

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	const user = requireUser(locals);
	const body = await parseBody(request, updateSchema);

	const updated = await EntryService.updateEntry(params.id, user.id, {
		...body,
		dateCooked: body.dateCooked ? new Date(body.dateCooked) : undefined
	});
	return updated ? json(updated) : notFound('Entry');
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = requireUser(locals);
	const deleted = await EntryService.deleteEntry(params.id, user.id);
	return deleted ? new Response(null, { status: 204 }) : notFound('Entry');
};
