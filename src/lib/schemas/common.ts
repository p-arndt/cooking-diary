import { z } from 'zod';

/**
 * Only local uploads may be stored as photo URLs. Arbitrary external URLs would let one
 * user plant tracking pixels or hotlinks that every viewer's browser then fetches.
 */
export const PHOTO_URL_PATTERN = /^\/files\/[A-Za-z0-9._-]+$/;

export const photoUrlSchema = z.string().regex(PHOTO_URL_PATTERN, 'Invalid photo URL');

/** A real calendar day in `YYYY-MM-DD`, the format the mobile client sends and receives. */
export const isoDateSchema = z.iso.date();

export const uuidSchema = z.uuid();

export function isUuid(value: unknown): value is string {
	return uuidSchema.safeParse(value).success;
}

/** Form fields that carry a JSON-encoded value, such as a hidden input with an id array. */
export function jsonField<T extends z.ZodType>(schema: T) {
	return z
		.string()
		.transform((text, ctx) => {
			try {
				return JSON.parse(text) as unknown;
			} catch {
				ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
				return z.NEVER;
			}
		})
		.pipe(schema);
}

/** Text value of a form field; empty and non-text fields count as absent. */
export function formText(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	return typeof value === 'string' && value !== '' ? value : null;
}

export function formatIssues(error: z.ZodError): string {
	return error.issues
		.map((issue) =>
			issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message
		)
		.join(', ');
}
