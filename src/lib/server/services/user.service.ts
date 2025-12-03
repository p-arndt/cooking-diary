import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import type { User } from '$lib/types';
import { eq } from 'drizzle-orm';

export class UserService {
	/**
	 * Get user by ID
	 */
	static async getUserById(userId: string): Promise<User | null> {
		const result = await db.select().from(user).where(eq(user.id, userId)).limit(1);
		return result[0] || null;
	}

	/**
	 * Get user by email
	 */
	static async getUserByEmail(email: string): Promise<User | null> {
		const result = await db.select().from(user).where(eq(user.email, email)).limit(1);
		return result[0] || null;
	}

	/**
	 * Toggle personal mode for user
	 */
	static async togglePersonalMode(userId: string, enabled: boolean): Promise<User | null> {
		const result = await db
			.update(user)
			.set({
				personalMode: enabled,
				updatedAt: new Date()
			})
			.where(eq(user.id, userId))
			.returning();

		return result[0] || null;
	}

	/**
	 * Get all users (admin only)
	 */
	static async getAllUsers(): Promise<User[]> {
		return await db.select().from(user);
	}
}
