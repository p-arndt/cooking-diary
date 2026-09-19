import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api';
import { FileService, FileValidationError } from '$lib/server/services/file.service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = requireUser(locals);
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
		return json({ url: await FileService.saveFile(file, user.id) }, { status: 201 });
	} catch (err) {
		if (err instanceof FileValidationError) {
			return json({ error: err.message }, { status: 400 });
		}
		console.error('Error uploading file:', err);
		return json({ error: 'Upload failed' }, { status: 500 });
	}
};
