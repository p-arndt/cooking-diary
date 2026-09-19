import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { and, arrayContains, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { mealEntries, meals } from '$lib/server/db/schema';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type ImageType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const EXTENSIONS: Record<ImageType, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp'
};

/** Same shape other code uses to validate photo URLs stored in the database. */
export const FILE_URL_PATTERN = /^\/files\/([A-Za-z0-9._-]+)$/;

// A leading dot is excluded so "." and ".." (and hidden files) can never resolve outside
// the upload directory or to something that isn't an upload.
const SAFE_FILENAME = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

const OWNED_FILENAME =
	/^([A-Za-z0-9-]+)_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|gif|webp)$/;

let uploadDir = join(process.cwd(), 'files');

export class FileValidationError extends Error {}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
	if (bytes.length < offset + signature.length) return false;
	return signature.every((byte, i) => bytes[offset + i] === byte);
}

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

export class FileService {
	/** Tests point this at a temp directory so they never touch the real uploads. */
	static setUploadDir(dir: string): void {
		uploadDir = dir;
	}

	static getUploadDir(): string {
		return uploadDir;
	}

	/** Identifies an image by its magic bytes; the client-supplied MIME type and name are not trusted. */
	static detectImageType(bytes: Uint8Array): ImageType | null {
		if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
		if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
		if (startsWith(bytes, ascii('GIF87a')) || startsWith(bytes, ascii('GIF89a')))
			return 'image/gif';
		if (startsWith(bytes, ascii('RIFF')) && startsWith(bytes, ascii('WEBP'), 8))
			return 'image/webp';
		return null;
	}

	/** New uploads carry their owner's id so reads can be authorized without a database lookup. */
	static generateFilename(userId: string, type: ImageType): string {
		return `${userId}_${crypto.randomUUID()}.${EXTENSIONS[type]}`;
	}

	/** Owner id encoded in a new-style filename, or null for legacy names. */
	static getOwnerId(filename: string): string | null {
		return OWNED_FILENAME.exec(filename)?.[1] ?? null;
	}

	static isSafeFilename(filename: string): boolean {
		return SAFE_FILENAME.test(filename);
	}

	/** Filename of a local upload URL, or null for anything else. */
	static filenameFromUrl(url: string): string | null {
		const filename = FILE_URL_PATTERN.exec(url)?.[1];
		return filename && this.isSafeFilename(filename) ? filename : null;
	}

	static async saveFile(file: File, userId: string): Promise<string> {
		if (file.size > MAX_FILE_SIZE) {
			throw new FileValidationError('File size exceeds 5MB limit');
		}

		const bytes = new Uint8Array(await file.arrayBuffer());
		const type = this.detectImageType(bytes);
		if (!type) {
			throw new FileValidationError(
				'Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'
			);
		}

		const filename = this.generateFilename(userId, type);
		await mkdir(uploadDir, { recursive: true });
		await writeFile(join(uploadDir, filename), bytes, { flag: 'wx' });

		return `/files/${filename}`;
	}

	static async saveFiles(files: File[], userId: string): Promise<string[]> {
		return Promise.all(files.map((file) => this.saveFile(file, userId)));
	}

	/**
	 * Whether the given URL is referenced by a meal or entry. Without `userId` any user's
	 * reference counts.
	 */
	static async isReferenced(url: string, userId?: string): Promise<boolean> {
		const mealMatch = userId
			? and(eq(meals.userId, userId), eq(meals.defaultPhotoUrl, url))
			: eq(meals.defaultPhotoUrl, url);
		const entryMatch = userId
			? and(eq(mealEntries.userId, userId), arrayContains(mealEntries.photoUrls, [url]))
			: arrayContains(mealEntries.photoUrls, [url]);

		const [meal] = await db.select({ id: meals.id }).from(meals).where(mealMatch).limit(1);
		if (meal) return true;
		const [entry] = await db
			.select({ id: mealEntries.id })
			.from(mealEntries)
			.where(entryMatch)
			.limit(1);
		return Boolean(entry);
	}

	/**
	 * New-style files are readable by their owner only. Legacy files carry no owner, so they
	 * are readable only by users who reference them from their own meals or entries.
	 */
	static async canRead(filename: string, userId: string): Promise<boolean> {
		if (!this.isSafeFilename(filename)) return false;
		const ownerId = this.getOwnerId(filename);
		if (ownerId !== null) return ownerId === userId;
		return this.isReferenced(`/files/${filename}`, userId);
	}

	/** File contents, or null if the name is unsafe or the file doesn't exist. */
	static async readFile(filename: string): Promise<Buffer | null> {
		if (!this.isSafeFilename(filename)) return null;
		try {
			return await readFile(join(uploadDir, filename));
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
			throw err;
		}
	}

	/**
	 * Deletes the files behind the given URLs unless some meal or entry of any user still
	 * references them. Callers pass URLs that were just removed from a record; a URL that is
	 * uploaded but not yet saved must not be passed, since it is unreferenced by definition.
	 * Never throws, so cleanup can't fail the operation that triggered it.
	 */
	static async deleteUnreferenced(urls: string[]): Promise<void> {
		for (const url of new Set(urls)) {
			try {
				const filename = this.filenameFromUrl(url);
				if (!filename) continue;
				if (await this.isReferenced(url)) continue;
				await unlink(join(uploadDir, filename));
			} catch (err) {
				if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue;
				console.error(`Failed to delete unreferenced file ${url}:`, err);
			}
		}
	}
}
