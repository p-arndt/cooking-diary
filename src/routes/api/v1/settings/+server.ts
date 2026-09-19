import { json } from '@sveltejs/kit';
import { parseBody, requireUser } from '$lib/server/api';
import { settingsUpdateSchema } from '$lib/schemas';
import { SettingsService } from '$lib/server/services/settings.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = requireUser(locals);
	return json(await SettingsService.getSettings(user.id));
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	const user = requireUser(locals);
	const body = await parseBody(request, settingsUpdateSchema);
	return json(await SettingsService.updateSettings(user.id, body));
};
