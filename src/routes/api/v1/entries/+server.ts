import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { isoDate, parseBody, requireUser } from '$lib/server/api';
import { EntryService } from '$lib/server/services/entry.service';
import { MealService } from '$lib/server/services/meal.service';
import type { RequestHandler } from './$types';

const createSchema = z.object({
	mealId: z.uuid(),
	dateCooked: z.string().regex(isoDate),
	notes: z.string().nullish(),
	photoUrls: z.array(z.string()).optional()
});

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = requireUser(locals);

	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');
	if (from && to && isoDate.test(from) && isoDate.test(to)) {
		const entries = await EntryService.getEntriesByDateRange(user.id, new Date(from), new Date(to));
		return json({ entries, hasMore: false });
	}

	const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20'), 1), 100);
	const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
	return json(await EntryService.getAllEntries(user.id, limit, offset));
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = requireUser(locals);
	const body = await parseBody(request, createSchema);

	if (!(await MealService.getMealById(body.mealId, user.id))) {
		return json({ error: 'Meal not found' }, { status: 404 });
	}

	const entry = await EntryService.createEntry(user.id, {
		mealId: body.mealId,
		dateCooked: new Date(body.dateCooked),
		notes: body.notes ?? null,
		photoUrls: body.photoUrls
	});
	return json(entry, { status: 201 });
};
