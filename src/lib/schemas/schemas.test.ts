import { describe, expect, it } from 'vitest';
import {
	entryFormSchema,
	entrySchema,
	isoDateSchema,
	MAX_ENTRY_PHOTOS,
	mealFormSchema,
	mealSchema,
	paginationSchema,
	photoUrlSchema,
	settingsFormSchema,
	settingsUpdateSchema
} from '$lib/schemas';

const UUID = '0b6c2d1e-7f3a-4c5b-9d8e-1a2b3c4d5e6f';

describe('photoUrlSchema', () => {
	it.each([
		'/files/1700000000000-abc123def.jpg',
		`/files/${UUID}_${UUID}.webp`,
		'/files/a_b-c.d.png'
	])('accepts local upload URL %s', (url) => {
		expect(photoUrlSchema.safeParse(url).success).toBe(true);
	});

	it.each([
		'https://tracker.example/pixel.gif',
		'//tracker.example/pixel.gif',
		'/files/../secret',
		'/files/a/b.jpg',
		'/files/',
		'/files/a b.jpg',
		'/other/a.jpg',
		'javascript:alert(1)',
		'/files/a.jpg?x=1'
	])('rejects %s', (url) => {
		expect(photoUrlSchema.safeParse(url).success).toBe(false);
	});
});

describe('isoDateSchema', () => {
	it('accepts real calendar days', () => {
		expect(isoDateSchema.safeParse('2026-02-28').success).toBe(true);
		expect(isoDateSchema.safeParse('2024-02-29').success).toBe(true);
	});

	it.each(['2026-02-30', '2026-13-01', '2026-1-1', '2026-01-01T00:00:00Z', ''])(
		'rejects %j',
		(value) => {
			expect(isoDateSchema.safeParse(value).success).toBe(false);
		}
	);
});

describe('mealSchema', () => {
	it.each(['easy', 'medium', 'hard', null, undefined])('accepts difficulty %j', (difficulty) => {
		expect(mealSchema.safeParse({ title: 'Soup', difficulty }).success).toBe(true);
	});

	it.each(['extreme', '', 'EASY'])('rejects difficulty %j', (difficulty) => {
		expect(mealSchema.safeParse({ title: 'Soup', difficulty }).success).toBe(false);
	});

	it('rejects a blank title and external photo URLs', () => {
		expect(mealSchema.safeParse({ title: '   ' }).success).toBe(false);
		expect(
			mealSchema.safeParse({ title: 'Soup', defaultPhotoUrl: 'https://example.com/a.jpg' }).success
		).toBe(false);
	});

	it('requires category ids to be uuids', () => {
		expect(mealSchema.safeParse({ title: 'Soup', categoryIds: [UUID] }).success).toBe(true);
		expect(mealSchema.safeParse({ title: 'Soup', categoryIds: ['1'] }).success).toBe(false);
	});
});

describe('mealFormSchema', () => {
	it('parses category ids from a JSON field', () => {
		const result = mealFormSchema.parse({ title: 'Soup', categoryIds: JSON.stringify([UUID]) });
		expect(result.categoryIds).toEqual([UUID]);
	});

	it.each(['not json', '{"a":1}', '["x"]', '[1]'])('rejects categoryIds %j', (categoryIds) => {
		expect(mealFormSchema.safeParse({ title: 'Soup', categoryIds }).success).toBe(false);
	});
});

describe('entrySchema', () => {
	const valid = { mealId: UUID, dateCooked: '2026-01-01' };

	it('accepts a minimal entry', () => {
		expect(entrySchema.safeParse(valid).success).toBe(true);
	});

	it('caps and validates photo URLs', () => {
		const urls = (n: number) => Array.from({ length: n }, (_, i) => `/files/p${i}.jpg`);
		expect(entrySchema.safeParse({ ...valid, photoUrls: urls(MAX_ENTRY_PHOTOS) }).success).toBe(
			true
		);
		expect(entrySchema.safeParse({ ...valid, photoUrls: urls(MAX_ENTRY_PHOTOS + 1) }).success).toBe(
			false
		);
		expect(
			entrySchema.safeParse({ ...valid, photoUrls: ['https://example.com/a.gif'] }).success
		).toBe(false);
	});

	it('rejects a non-uuid meal id and an impossible date', () => {
		expect(entrySchema.safeParse({ ...valid, mealId: 'abc' }).success).toBe(false);
		expect(entrySchema.safeParse({ ...valid, dateCooked: '2026-02-31' }).success).toBe(false);
	});

	it('parses photo URLs from a JSON form field', () => {
		expect(entryFormSchema.parse({ ...valid, photoUrls: '["/files/a.jpg"]' }).photoUrls).toEqual([
			'/files/a.jpg'
		]);
		expect(entryFormSchema.safeParse({ ...valid, photoUrls: '[' }).success).toBe(false);
	});
});

describe('settings schemas', () => {
	it.each([0, 14, 365])('accepts daysThreshold %d', (value) => {
		expect(settingsUpdateSchema.safeParse({ suggestionDaysThreshold: value }).success).toBe(true);
	});

	it.each([-1, 366, 1.5, '14'])('rejects daysThreshold %j', (value) => {
		expect(settingsUpdateSchema.safeParse({ suggestionDaysThreshold: value }).success).toBe(false);
	});

	it('requires excluded category ids to be uuids', () => {
		expect(settingsUpdateSchema.safeParse({ suggestionExcludedCategoryIds: [UUID] }).success).toBe(
			true
		);
		expect(
			settingsUpdateSchema.safeParse({ suggestionExcludedCategoryIds: ['nope'] }).success
		).toBe(false);
	});

	it('coerces form text and rejects out-of-range or malformed values', () => {
		const form = (suggestionDaysThreshold: string, suggestionExcludedCategoryIds = '[]') => ({
			suggestionDaysThreshold,
			suggestionUseDayOfWeek: true,
			suggestionExcludedCategoryIds
		});
		expect(settingsFormSchema.parse(form('30')).suggestionDaysThreshold).toBe(30);
		expect(settingsFormSchema.safeParse(form('abc')).success).toBe(false);
		expect(settingsFormSchema.safeParse(form('400')).success).toBe(false);
		expect(settingsFormSchema.safeParse(form('14', '["x"]')).success).toBe(false);
		expect(settingsFormSchema.safeParse(form('14', 'oops')).success).toBe(false);
	});
});

describe('paginationSchema', () => {
	const schema = paginationSchema(20);

	it('applies defaults and clamps out-of-range values', () => {
		expect(schema.parse({})).toEqual({ limit: 20, offset: 0 });
		expect(schema.parse({ limit: '500', offset: '-3' })).toEqual({ limit: 100, offset: 0 });
		expect(schema.parse({ limit: '0' })).toEqual({ limit: 1, offset: 0 });
	});

	it('rejects non-numbers', () => {
		expect(schema.safeParse({ limit: 'abc' }).success).toBe(false);
		expect(schema.safeParse({ offset: '1.5' }).success).toBe(false);
	});
});
