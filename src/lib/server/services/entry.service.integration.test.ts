import { existsSync } from 'fs';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/server/db';
import { mealEntries } from '$lib/server/db/schema';
import { createEntry, createMeal, createUser } from '$lib/server/test/factories';
import { EntryService } from './entry.service';
import { InvalidInputError, NotFoundError } from './errors';
import { FileService } from './file.service';

let dir: string;
const originalDir = FileService.getUploadDir();

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'cooking-diary-entries-'));
	FileService.setUploadDir(dir);
});

afterEach(async () => {
	FileService.setUploadDir(originalDir);
	await rm(dir, { recursive: true, force: true });
});

async function upload(ownerId: string) {
	const name = `${ownerId}_${crypto.randomUUID()}.jpg`;
	await writeFile(join(dir, name), 'x');
	return `/files/${name}`;
}

const onDisk = (url: string) => existsSync(join(dir, url.slice('/files/'.length)));

const entryRow = async (id: string) =>
	(await db.select().from(mealEntries).where(eq(mealEntries.id, id)))[0];

async function setup() {
	const alice = await createUser('Alice');
	const bob = await createUser('Bob');
	const aliceMeal = await createMeal(alice.id, 'Alice meal');
	const bobMeal = await createMeal(bob.id, 'Bob meal');
	return { alice, bob, aliceMeal, bobMeal };
}

describe('EntryService.createEntry', () => {
	it('creates an entry for the user’s own meal', async () => {
		const { bob, bobMeal } = await setup();
		const entry = await EntryService.createEntry(bob.id, {
			mealId: bobMeal.id,
			dateCooked: '2026-03-01'
		});
		expect(entry.meal.id).toBe(bobMeal.id);
		expect(entry.dateCooked.toISOString().slice(0, 10)).toBe('2026-03-01');
	});

	it.each([
		['another user’s meal', (s: Awaited<ReturnType<typeof setup>>) => s.aliceMeal.id],
		['a nonexistent meal', () => crypto.randomUUID()],
		['a malformed id', () => 'nope']
	])('rejects %s as not found and creates nothing', async (_, pick) => {
		const s = await setup();
		await expect(
			EntryService.createEntry(s.bob.id, { mealId: pick(s), dateCooked: '2026-03-01' })
		).rejects.toBeInstanceOf(NotFoundError);
		expect(await db.select().from(mealEntries).where(eq(mealEntries.userId, s.bob.id))).toEqual([]);
	});

	it('rejects photos the user does not own', async () => {
		const { alice, bob, bobMeal } = await setup();
		await expect(
			EntryService.createEntry(bob.id, {
				mealId: bobMeal.id,
				dateCooked: '2026-03-01',
				photoUrls: [await upload(alice.id)]
			})
		).rejects.toBeInstanceOf(InvalidInputError);
	});
});

describe('EntryService.updateEntry', () => {
	it('rejects moving an entry to another user’s meal and leaves it untouched', async () => {
		const { bob, bobMeal, aliceMeal } = await setup();
		const entry = await createEntry(bob.id, bobMeal.id);

		await expect(
			EntryService.updateEntry(entry.id, bob.id, { mealId: aliceMeal.id, notes: 'changed' })
		).rejects.toBeInstanceOf(NotFoundError);

		const row = await entryRow(entry.id);
		expect(row.mealId).toBe(bobMeal.id);
		expect(row.notes).toBeNull();
	});

	it('treats another user’s entry as not found', async () => {
		const { alice, bob, aliceMeal } = await setup();
		const entry = await createEntry(alice.id, aliceMeal.id);

		await expect(
			EntryService.updateEntry(entry.id, bob.id, { notes: 'hijacked' })
		).rejects.toBeInstanceOf(NotFoundError);
		await expect(EntryService.updateEntry('nope', bob.id, {})).rejects.toBeInstanceOf(
			NotFoundError
		);
		expect((await entryRow(entry.id)).notes).toBeNull();
	});

	it('deletes removed photos after commit and keeps the rest', async () => {
		const { bob, bobMeal } = await setup();
		const kept = await upload(bob.id);
		const removed = await upload(bob.id);
		const entry = await EntryService.createEntry(bob.id, {
			mealId: bobMeal.id,
			dateCooked: '2026-03-01',
			photoUrls: [kept, removed]
		});

		const updated = await EntryService.updateEntry(entry.id, bob.id, { photoUrls: [kept] });

		expect(updated.photoUrls).toEqual([kept]);
		expect(onDisk(kept)).toBe(true);
		expect(onDisk(removed)).toBe(false);
	});
});

describe('EntryService.deleteEntry', () => {
	it('treats another user’s entry as not found', async () => {
		const { alice, bob, aliceMeal } = await setup();
		const entry = await createEntry(alice.id, aliceMeal.id);
		await expect(EntryService.deleteEntry(entry.id, bob.id)).rejects.toBeInstanceOf(NotFoundError);
		expect(await entryRow(entry.id)).toBeDefined();
	});

	it('deletes the entry’s photos', async () => {
		const { bob, bobMeal } = await setup();
		const photo = await upload(bob.id);
		const entry = await EntryService.createEntry(bob.id, {
			mealId: bobMeal.id,
			dateCooked: '2026-03-01',
			photoUrls: [photo]
		});

		await EntryService.deleteEntry(entry.id, bob.id);

		expect(await entryRow(entry.id)).toBeUndefined();
		expect(onDisk(photo)).toBe(false);
	});
});

describe('user-scoped entry reads', () => {
	it('never return other users’ entries or meals', async () => {
		const { alice, bob, aliceMeal, bobMeal } = await setup();
		await createEntry(alice.id, aliceMeal.id, '2026-04-10');
		const own = await createEntry(bob.id, bobMeal.id, '2026-04-10');
		// Bob's entry on Alice's meal, as could be written before ownership was checked.
		await createEntry(bob.id, aliceMeal.id, '2026-04-10');

		const from = new Date('2026-04-01');
		const to = new Date('2026-04-30');
		const ids = (list: { id: string }[]) => list.map((e) => e.id);

		expect(ids((await EntryService.getAllEntries(bob.id)).entries)).toEqual([own.id]);
		expect(ids(await EntryService.getEntriesByDateRange(bob.id, from, to))).toEqual([own.id]);
		expect(ids(await EntryService.getEntriesByDate(bob.id, new Date('2026-04-10')))).toEqual([
			own.id
		]);
		expect(await EntryService.getEntriesByMealId(bob.id, aliceMeal.id)).toEqual([]);
		expect(await EntryService.getEntriesByMealId(bob.id, 'nope')).toEqual([]);
		expect(ids(await EntryService.getEntriesByMealId(bob.id, bobMeal.id))).toEqual([own.id]);

		const aliceDates = await EntryService.getDatesWithEntries(alice.id, from, to);
		expect(aliceDates).toEqual(['2026-04-10']);
		expect(
			await EntryService.getDatesWithEntries(await createUser().then((u) => u.id), from, to)
		).toEqual([]);
	});
});
