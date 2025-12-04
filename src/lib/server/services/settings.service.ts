import { db } from '$lib/server/db';
import { userSettings, type UserSettingsJson } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Default values for all settings - extend this as you add new settings
export const DEFAULT_SETTINGS: Required<UserSettingsJson> = {
	suggestionDaysThreshold: 14,
	suggestionUseDayOfWeek: true,
	suggestionExcludedCategoryIds: []
};

export type UserSettingsComplete = Required<UserSettingsJson>;

export class SettingsService {
	/**
	 * Merge user settings with defaults to ensure all fields exist
	 */
	private static mergeWithDefaults(settings: UserSettingsJson): UserSettingsComplete {
		return {
			...DEFAULT_SETTINGS,
			...settings
		};
	}

	/**
	 * Get user settings, create with defaults if not exists
	 */
	static async getSettings(userId: string): Promise<UserSettingsComplete> {
		const existing = await db
			.select()
			.from(userSettings)
			.where(eq(userSettings.userId, userId))
			.limit(1);

		if (existing[0]) {
			return this.mergeWithDefaults(existing[0].settings);
		}

		// Create new settings record with empty JSON (defaults applied on read)
		const [created] = await db
			.insert(userSettings)
			.values({
				userId,
				settings: {}
			})
			.returning();

		return this.mergeWithDefaults(created.settings);
	}

	/**
	 * Get raw settings record (with metadata)
	 */
	static async getSettingsRecord(userId: string) {
		const existing = await db
			.select()
			.from(userSettings)
			.where(eq(userSettings.userId, userId))
			.limit(1);

		if (existing[0]) {
			return {
				...existing[0],
				settings: this.mergeWithDefaults(existing[0].settings)
			};
		}

		const [created] = await db
			.insert(userSettings)
			.values({
				userId,
				settings: {}
			})
			.returning();

		return {
			...created,
			settings: this.mergeWithDefaults(created.settings)
		};
	}

	/**
	 * Update user settings (partial update - only updates provided fields)
	 */
	static async updateSettings(
		userId: string,
		updates: Partial<UserSettingsJson>
	): Promise<UserSettingsComplete> {
		// Ensure record exists
		const existing = await this.getSettingsRecord(userId);

		// Merge existing settings with updates
		const newSettings: UserSettingsJson = {
			...existing.settings,
			...updates
		};

		const [updated] = await db
			.update(userSettings)
			.set({
				settings: newSettings,
				updatedAt: new Date()
			})
			.where(eq(userSettings.userId, userId))
			.returning();

		return this.mergeWithDefaults(updated.settings);
	}

	/**
	 * Reset settings to defaults
	 */
	static async resetSettings(userId: string): Promise<UserSettingsComplete> {
		await db
			.update(userSettings)
			.set({
				settings: {},
				updatedAt: new Date()
			})
			.where(eq(userSettings.userId, userId));

		return DEFAULT_SETTINGS;
	}
}
