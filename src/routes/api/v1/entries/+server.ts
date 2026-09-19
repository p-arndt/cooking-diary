import { json } from '@sveltejs/kit';
import { apiError, parseBody, parseInput, requireUser } from '$lib/server/api';
import { entrySchema, isoDateSchema, paginationSchema } from '$lib/schemas';
import { EntryService } from '$lib/server/services/entry.service';
import type { RequestHandler } from './$types';

const querySchema = paginationSchema(20);

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = requireUser(locals);

	const from = isoDateSchema.safeParse(url.searchParams.get('from'));
	const to = isoDateSchema.safeParse(url.searchParams.get('to'));
	if (from.success && to.success) {
		const entries = await EntryService.getEntriesByDateRange(
			user.id,
			new Date(from.data),
			new Date(to.data)
		);
		return json({ entries, hasMore: false });
	}

	const { limit, offset } = parseInput(
		{
			limit: url.searchParams.get('limit') ?? undefined,
			offset: url.searchParams.get('offset') ?? undefined
		},
		querySchema
	);
	return json(await EntryService.getAllEntries(user.id, limit, offset));
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = requireUser(locals);
	const body = await parseBody(request, entrySchema);
	try {
		return json(await EntryService.createEntry(user.id, body), { status: 201 });
	} catch (err) {
		return apiError(err);
	}
};
