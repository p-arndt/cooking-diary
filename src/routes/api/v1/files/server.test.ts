import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileService } from '$lib/server/services/file.service';
import { POST } from './+server';

type Event = Parameters<typeof POST>[0];

const USER = { id: '0b6c2d1e-7f3a-4c5b-9d8e-1a2b3c4d5e6f' };
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

let dir: string;
const originalDir = FileService.getUploadDir();

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'cooking-diary-files-'));
	FileService.setUploadDir(dir);
});

afterEach(async () => {
	FileService.setUploadDir(originalDir);
	await rm(dir, { recursive: true, force: true });
});

function upload(file: File) {
	const body = new FormData();
	body.set('file', file);
	const request = new Request('http://localhost/upload', { method: 'POST', body });
	return POST({ request, locals: { user: USER, session: null } } as unknown as Event);
}

describe('POST upload', () => {
	it('stores the image under the uploading user and returns its URL', async () => {
		const response = await upload(new File([JPEG], 'photo.png', { type: 'image/png' }));

		expect(response.status).toBe(201);
		const { url } = await response.json();
		expect(url).toMatch(new RegExp(`^/files/${USER.id}_[0-9a-f-]{36}\\.jpg$`));
	});

	it('rejects non-image content with a readable message', async () => {
		const response = await upload(new File(['<svg/>'], 'photo.jpg', { type: 'image/jpeg' }));

		expect(response.status).toBe(400);
		expect((await response.json()).error).toMatch(/Invalid file type/);
	});
});
