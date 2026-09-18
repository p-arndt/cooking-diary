import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { parseBody, requireUser } from '$lib/server/api';
import { SettingsService } from '$lib/server/services/settings.service';
import type { RequestHandler } from './$types';

const updateSchema = z.object({
	suggestionDaysThreshold: z.int().min(0).max(365).optional(),
	suggestionUseDayOfWeek: z.boolean().optional(),
	suggestionExcludedCategoryIds: z.array(z.uuid()).optional()
});

export const GET: RequestHandler = async ({ locals }) => {
	const user = requireUser(locals);
	return json(await SettingsService.getSettings(user.id));
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	const user = requireUser(locals);
	const body = await parseBody(request, updateSchema);
	return json(await SettingsService.updateSettings(user.id, body));
};
