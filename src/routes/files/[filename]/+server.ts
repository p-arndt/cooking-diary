import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const GET: RequestHandler = async ({ params, locals }) => {
	// check better auth session
	if (!locals.user) {
		throw redirect(307, '/login');
	}

	const filename = params.filename;
	if (!filename) {
		throw error(400, 'Filename required');
	}

	// Security: prevent path traversal
	if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
		throw error(400, 'Invalid filename');
	}

	const filePath = join(process.cwd(), 'files', filename);

	if (!existsSync(filePath)) {
		throw error(404, 'File not found');
	}

	try {
		const file = await readFile(filePath);
		const ext = filename.split('.').pop()?.toLowerCase();

		let contentType = 'application/octet-stream';
		if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
		else if (ext === 'png') contentType = 'image/png';
		else if (ext === 'webp') contentType = 'image/webp';
		else if (ext === 'gif') contentType = 'image/gif';

		return new Response(file, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch (err) {
		console.error('Error reading file:', err);
		throw error(500, 'Error reading file');
	}
};
