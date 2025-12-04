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

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { id, mealId, dateCooked, notes, photoUrls } = body;

		if (!id) {
			return json({ error: 'Entry ID is required' }, { status: 400 });
		}

		const updated = await EntryService.updateEntry(id, locals.user.id, {
			mealId,
			dateCooked: dateCooked ? new Date(dateCooked) : undefined,
			notes,
			photoUrls
		});

		if (!updated) {
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		return json({ success: true, entry: updated });
	} catch (error) {
		console.error('Error updating entry:', error);
		return json({ error: 'Failed to update entry' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { id } = body;

		if (!id) {
			return json({ error: 'Entry ID is required' }, { status: 400 });
		}

		const success = await EntryService.deleteEntry(id, locals.user.id);

		if (!success) {
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting entry:', error);
		return json({ error: 'Failed to delete entry' }, { status: 500 });
	}
};

