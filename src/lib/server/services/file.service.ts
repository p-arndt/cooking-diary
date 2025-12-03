import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = 'files';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export class FileService {
	/**
	 * Ensure upload directory exists
	 */
	static async ensureUploadDir(): Promise<void> {
		const uploadPath = join(process.cwd(), UPLOAD_DIR);
		if (!existsSync(uploadPath)) {
			await mkdir(uploadPath, { recursive: true });
		}
	}

	/**
	 * Validate file
	 */
	static validateFile(file: File): { valid: boolean; error?: string } {
		if (file.size > MAX_FILE_SIZE) {
			return { valid: false, error: 'File size exceeds 5MB limit' };
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			return { valid: false, error: 'Invalid file type. Only images are allowed.' };
		}

		return { valid: true };
	}

	/**
	 * Generate unique filename
	 */
	static generateFilename(originalName: string): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		const extension = originalName.split('.').pop() || 'jpg';
		return `${timestamp}-${random}.${extension}`;
	}

	/**
	 * Save uploaded file
	 */
	static async saveFile(file: File): Promise<string> {
		await this.ensureUploadDir();

		const validation = this.validateFile(file);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		const filename = this.generateFilename(file.name);
		const filePath = join(process.cwd(), UPLOAD_DIR, filename);

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		await writeFile(filePath, buffer);

		return `/files/${filename}`;
	}

	/**
	 * Save multiple files
	 */
	static async saveFiles(files: File[]): Promise<string[]> {
		const paths = await Promise.all(files.map((file) => this.saveFile(file)));
		return paths;
	}
}

