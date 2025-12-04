import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FileService } from '$lib/server/services/file.service';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file || file.size === 0) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		const url = await FileService.saveFile(file);
		return json({ url });
	} catch (error) {
		console.error('Error uploading file:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
		return json({ error: errorMessage }, { status: 500 });
	}
};



