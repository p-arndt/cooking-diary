import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { EntryService } from '$lib/server/services/entry.service';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const limit = parseInt(url.searchParams.get('limit') || '15');
	const offset = parseInt(url.searchParams.get('offset') || '0');

	const { entries, hasMore } = await EntryService.getAllEntries(
		locals.user.id,
		limit,
		offset
	);

	return json({ entries, hasMore });
};

