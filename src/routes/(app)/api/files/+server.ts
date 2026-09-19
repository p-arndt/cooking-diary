import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FileService, FileValidationError } from '$lib/server/services/file.service';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

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
		const url = await FileService.saveFile(file, locals.user.id);
		return json({ url });
	} catch (err) {
		if (err instanceof FileValidationError) {
			return json({ error: err.message }, { status: 400 });
		}
		console.error('Error uploading file:', err);
		return json({ error: 'Failed to upload file' }, { status: 500 });
	}
};
