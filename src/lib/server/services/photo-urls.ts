import { FileService } from './file.service';
import { InvalidInputError } from './errors';

/**
 * A user may only attach uploads they own. New filenames carry the owner's id; legacy ones
 * don't, so those are accepted only if the user already references them. Without this a
 * user could attach someone else's legacy file and thereby gain read access to it.
 */
export async function assertOwnPhotoUrls(userId: string, urls: string[]): Promise<void> {
	for (const url of new Set(urls)) {
		const filename = FileService.filenameFromUrl(url);
		if (!filename) throw new InvalidInputError('Invalid photo URL');

		const ownerId = FileService.getOwnerId(filename);
		if (ownerId === userId) continue;
		if (ownerId === null && (await FileService.isReferenced(url, userId))) continue;
		throw new InvalidInputError('Invalid photo URL');
	}
}

/** URLs present in `before` but not in `after`. */
export function removedUrls(
	before: readonly (string | null | undefined)[],
	after: readonly (string | null | undefined)[]
): string[] {
	const kept = new Set(after);
	return before.filter((url): url is string => !!url && !kept.has(url));
}
