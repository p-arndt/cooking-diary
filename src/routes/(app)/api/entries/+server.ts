import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { apiError, parseBody, parseInput, requireUser } from '$lib/server/api';
import { entryUpdateSchema, paginationSchema } from '$lib/schemas';
import { EntryService } from '$lib/server/services/entry.service';
import type { RequestHandler } from './$types';

const querySchema = paginationSchema(15);

const patchSchema = entryUpdateSchema.extend({
	id: z.uuid(),
	// The quick-add dialog sends an empty string when no date is selected.
	dateCooked: z.preprocess(
		(value) => (value === '' ? undefined : value),
		entryUpdateSchema.shape.dateCooked
	)
});

const deleteSchema = z.object({ id: z.uuid() });

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = requireUser(locals);
	const { limit, offset } = parseInput(
		{
			limit: url.searchParams.get('limit') ?? undefined,
			offset: url.searchParams.get('offset') ?? undefined
		},
		querySchema
	);
	return json(await EntryService.getAllEntries(user.id, limit, offset));
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	const user = requireUser(locals);
	const { id, ...data } = await parseBody(request, patchSchema);
	try {
		return json({ success: true, entry: await EntryService.updateEntry(id, user.id, data) });
	} catch (err) {
		return apiError(err);
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	const user = requireUser(locals);
	const { id } = await parseBody(request, deleteSchema);
	try {
		await EntryService.deleteEntry(id, user.id);
		return json({ success: true });
	} catch (err) {
		return apiError(err);
	}
};
