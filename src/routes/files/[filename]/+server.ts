import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FileService } from '$lib/server/services/file.service';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(307, '/login');
	}

	const filename = params.filename;
	if (!filename || !FileService.isSafeFilename(filename)) {
		throw error(400, 'Invalid filename');
	}

	// Unauthorized and missing files look the same so the response doesn't reveal which
	// files exist.
	if (!(await FileService.canRead(filename, locals.user.id))) {
		throw error(404, 'File not found');
	}

	let file: Buffer | null;
	try {
		file = await FileService.readFile(filename);
	} catch (err) {
		console.error('Error reading file:', err);
		throw error(500, 'Error reading file');
	}
	if (!file) {
		throw error(404, 'File not found');
	}

	// Legacy uploads were typed by client-supplied extension, so the type is taken from the
	// content; anything that isn't a known image is only offered as a download.
	const imageType = FileService.detectImageType(file);

	return new Response(new Uint8Array(file), {
		headers: {
			'Content-Type': imageType ?? 'application/octet-stream',
			'Content-Disposition': imageType ? 'inline' : 'attachment',
			'X-Content-Type-Options': 'nosniff',
			'Content-Security-Policy': "default-src 'none'; sandbox",
			// private: these are authenticated photos and must not be served from shared caches.
			'Cache-Control': 'private, max-age=31536000, immutable'
		}
	});
};
