import { z } from 'zod';
import { isoDateSchema, jsonField, photoUrlSchema } from './common';

/** Matches BODY_SIZE_LIMIT, which is sized for this many 5 MB uploads per request. */
export const MAX_ENTRY_PHOTOS = 10;

export const entryPhotoUrlsSchema = z.array(photoUrlSchema).max(MAX_ENTRY_PHOTOS);

export const entrySchema = z.object({
	mealId: z.uuid(),
	dateCooked: isoDateSchema,
	notes: z.string().nullish(),
	photoUrls: entryPhotoUrlsSchema.optional()
});

export const entryUpdateSchema = entrySchema.partial();

/** The web form sends already-uploaded photo URLs as a JSON array in a single field. */
export const entryFormSchema = entrySchema.extend({
	photoUrls: jsonField(entryPhotoUrlsSchema)
});

export type EntryInput = z.infer<typeof entrySchema>;
export type EntryUpdateInput = z.infer<typeof entryUpdateSchema>;

function pageNumber(fallback: number, min: number, max: number) {
	return z.coerce
		.number()
		.int()
		.default(fallback)
		.transform((value) => Math.min(Math.max(value, min), max));
}

/** Out-of-range values are clamped rather than rejected, which older clients rely on. */
export function paginationSchema(defaultLimit: number) {
	return z.object({
		limit: pageNumber(defaultLimit, 1, 100),
		offset: pageNumber(0, 0, Number.MAX_SAFE_INTEGER)
	});
}
