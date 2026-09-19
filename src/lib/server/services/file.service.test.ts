import { mkdtemp, readdir, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FILE_URL_PATTERN, FileService, FileValidationError } from './file.service';

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00];
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));
const GIF87 = ascii('GIF87a....');
const GIF89 = ascii('GIF89a....');
const WEBP = [...ascii('RIFF'), 0x24, 0x00, 0x00, 0x00, ...ascii('WEBPVP8 ')];

const bytes = (values: number[]) => new Uint8Array(values);
const USER_ID = '0b6c2d1e-7f3a-4c5b-9d8e-1a2b3c4d5e6f';

describe('FileService.detectImageType', () => {
	it.each([
		['image/jpeg', JPEG],
		['image/png', PNG],
		['image/gif', GIF87],
		['image/gif', GIF89],
		['image/webp', WEBP]
	])('detects %s from magic bytes', (type, header) => {
		expect(FileService.detectImageType(bytes(header))).toBe(type);
	});

	it.each([
		['empty input', []],
		['truncated JPEG', [0xff, 0xd8]],
		['truncated PNG', PNG.slice(0, 7)],
		['GIF with unknown version', ascii('GIF88a')],
		['RIFF that is not WebP', [...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WAVE')]],
		['WebP marker without RIFF', [0, 0, 0, 0, 0, 0, 0, 0, ...ascii('WEBP')]],
		['SVG', ascii('<svg xmlns="http://www.w3.org/2000/svg"></svg>')],
		['HTML', ascii('<!doctype html><script>alert(1)</script>')],
		['PDF', ascii('%PDF-1.7')]
	])('rejects %s', (_, header) => {
		expect(FileService.detectImageType(bytes(header))).toBeNull();
	});
});

describe('FileService.generateFilename', () => {
	it('prefixes the owner id and derives the extension from the detected type', () => {
		expect(FileService.generateFilename(USER_ID, 'image/jpeg')).toMatch(
			new RegExp(`^${USER_ID}_[0-9a-f-]{36}\\.jpg$`)
		);
		expect(FileService.generateFilename(USER_ID, 'image/png')).toMatch(/\.png$/);
		expect(FileService.generateFilename(USER_ID, 'image/gif')).toMatch(/\.gif$/);
		expect(FileService.generateFilename(USER_ID, 'image/webp')).toMatch(/\.webp$/);
	});

	it('produces names that are unique, URL-safe and carry their owner', () => {
		const a = FileService.generateFilename(USER_ID, 'image/png');
		const b = FileService.generateFilename(USER_ID, 'image/png');
		expect(a).not.toBe(b);
		expect(`/files/${a}`).toMatch(FILE_URL_PATTERN);
		expect(FileService.getOwnerId(a)).toBe(USER_ID);
	});
});

describe('FileService filename parsing', () => {
	it('treats legacy names as ownerless', () => {
		expect(FileService.getOwnerId('1700000000000-abc123def.jpg')).toBeNull();
		expect(FileService.isSafeFilename('1700000000000-abc123def.jpg')).toBe(true);
	});

	it.each(['..', '.', '.env', '../secret', 'a/b', 'a\\b', 'a b.jpg', '', 'x%2F..'])(
		'rejects unsafe filename %j',
		(name) => {
			expect(FileService.isSafeFilename(name)).toBe(false);
		}
	);

	it('only maps local upload URLs to filenames', () => {
		expect(FileService.filenameFromUrl('/files/1700-abc.jpg')).toBe('1700-abc.jpg');
		expect(FileService.filenameFromUrl('/files/..')).toBeNull();
		expect(FileService.filenameFromUrl('https://example.com/files/a.jpg')).toBeNull();
		expect(FileService.filenameFromUrl('/files/a/b.jpg')).toBeNull();
		expect(FileService.filenameFromUrl('/other/a.jpg')).toBeNull();
	});
});

describe('FileService.saveFile', () => {
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

	it('ignores the client name and MIME type and stores under the owner', async () => {
		const file = new File([bytes(PNG)], 'evil.html', { type: 'text/html' });
		const url = await FileService.saveFile(file, USER_ID);

		expect(url).toMatch(new RegExp(`^/files/${USER_ID}_[0-9a-f-]{36}\\.png$`));
		const stored = await readFile(join(dir, url.slice('/files/'.length)));
		expect([...stored]).toEqual(PNG);
	});

	it('rejects content that is not an allowed image even if it claims to be one', async () => {
		const file = new File([ascii('<svg/>').join(',')], 'photo.jpg', { type: 'image/jpeg' });
		await expect(FileService.saveFile(file, USER_ID)).rejects.toBeInstanceOf(FileValidationError);
		expect(await readdir(dir)).toEqual([]);
	});

	it('rejects files over 5MB', async () => {
		const file = new File([bytes(JPEG), new Uint8Array(5 * 1024 * 1024)], 'big.jpg');
		await expect(FileService.saveFile(file, USER_ID)).rejects.toThrow(
			'File size exceeds 5MB limit'
		);
		expect(await readdir(dir)).toEqual([]);
	});
});
