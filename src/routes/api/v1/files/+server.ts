import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api';
import { FileService } from '$lib/server/services/file.service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	requireUser(locals);
	let file: FormDataEntryValue | null;
	try {
		file = (await request.formData()).get('file');
	} catch {
		return json({ error: 'Expected multipart/form-data body' }, { status: 400 });
	}
	if (!(file instanceof File) || file.size === 0) {
		return json({ error: 'No file provided' }, { status: 400 });
	}

	try {
		return json({ url: await FileService.saveFile(file) }, { status: 201 });
	} catch (err) {
		return json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 400 });
	}
};
