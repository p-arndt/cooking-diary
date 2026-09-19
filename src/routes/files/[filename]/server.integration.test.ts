import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/server/db';
import { mealEntries, meals } from '$lib/server/db/schema';
import { FileService } from '$lib/server/services/file.service';
import { createEntry, createMeal, createUser } from '$lib/server/test/factories';
import { GET } from './+server';

type Event = Parameters<typeof GET>[0];
type User = Awaited<ReturnType<typeof createUser>>;

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

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

function get(filename: string, user: User | null) {
	return GET({ params: { filename }, locals: { user, session: null } } as unknown as Event);
}

async function store(name: string, content: Uint8Array | string = PNG) {
	await writeFile(join(dir, name), content);
	return name;
}

const legacyName = (ext = 'png') =>
	`${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;

describe('GET /files/[filename]', () => {
	it('serves a new-style file to its owner with safe headers', async () => {
		const owner = await createUser();
		const name = await store(FileService.generateFilename(owner.id, 'image/png'));

		const response = await get(name, owner);

		expect(response.status).toBe(200);
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG);
		expect(Object.fromEntries(response.headers)).toMatchObject({
			'content-type': 'image/png',
			'content-disposition': 'inline',
			'x-content-type-options': 'nosniff',
			'content-security-policy': "default-src 'none'; sandbox",
			'cache-control': 'private, max-age=31536000, immutable'
		});
	});

	it('returns 404 for another user’s new-style file', async () => {
		const owner = await createUser();
		const other = await createUser();
		const name = await store(FileService.generateFilename(owner.id, 'image/png'));

		await expect(get(name, other)).rejects.toMatchObject({ status: 404 });
	});

	it('serves a legacy file only to users referencing it', async () => {
		const owner = await createUser();
		const other = await createUser();
		const mealName = await store(legacyName());
		const entryName = await store(legacyName());
		const meal = await createMeal(owner.id);
		await db
			.update(meals)
			.set({ defaultPhotoUrl: `/files/${mealName}` })
			.where(eq(meals.id, meal.id));
		const entry = await createEntry(owner.id, meal.id);
		await db
			.update(mealEntries)
			.set({ photoUrls: [`/files/${entryName}`] })
			.where(eq(mealEntries.id, entry.id));

		expect((await get(mealName, owner)).status).toBe(200);
		expect((await get(entryName, owner)).status).toBe(200);
		await expect(get(mealName, other)).rejects.toMatchObject({ status: 404 });
		await expect(get(entryName, other)).rejects.toMatchObject({ status: 404 });
	});

	it('returns 404 for an unreferenced legacy file', async () => {
		const user = await createUser();
		const name = await store(legacyName());

		await expect(get(name, user)).rejects.toMatchObject({ status: 404 });
	});

	it('returns 404 for a missing file the user owns', async () => {
		const owner = await createUser();

		await expect(
			get(FileService.generateFilename(owner.id, 'image/png'), owner)
		).rejects.toMatchObject({ status: 404 });
	});

	it('offers non-image legacy content only as a download', async () => {
		const owner = await createUser();
		const name = await store(legacyName('html'), '<script>alert(1)</script>');
		const meal = await createMeal(owner.id);
		await db
			.update(meals)
			.set({ defaultPhotoUrl: `/files/${name}` })
			.where(eq(meals.id, meal.id));

		const response = await get(name, owner);

		expect(response.headers.get('content-type')).toBe('application/octet-stream');
		expect(response.headers.get('content-disposition')).toBe('attachment');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
	});

	it.each(['..', '.env', '..%2Fetc', 'a b.png'])('rejects unsafe filename %j', async (name) => {
		const user = await createUser();

		await expect(get(name, user)).rejects.toMatchObject({ status: 400 });
	});

	it('redirects anonymous requests to login', async () => {
		await expect(get(legacyName(), null)).rejects.toMatchObject({
			status: 307,
			location: '/login'
		});
	});
});
