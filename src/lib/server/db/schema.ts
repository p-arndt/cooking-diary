// src/lib/server/db/schema.ts
import { relations } from 'drizzle-orm';
import { boolean, date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const user = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified')
		.$defaultFn(() => false)
		.notNull(),
	image: text('image'),
	timezone: text('timezone')
		.$defaultFn(() => 'UTC')
		.notNull(),
	isAdmin: boolean('is_admin')
		.$defaultFn(() => false)
		.notNull(),
	personalMode: boolean('personal_mode')
		.$defaultFn(() => false)
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const session = pgTable('sessions', {
	id: uuid('id').defaultRandom().primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable('accounts', {
	id: uuid('id').defaultRandom().primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable('verifications', {
	id: uuid('id').defaultRandom().primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// -------------------------------
// MEALS
// -------------------------------
export const meals = pgTable('meals', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),

	title: text('title').notNull(),
	defaultNotes: text('default_notes'),
	defaultPhotoUrl: text('default_photo_url'),

	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const mealsRelations = relations(meals, ({ one, many }) => ({
	user: one(user, {
		fields: [meals.userId],
		references: [user.id]
	}),
	categories: many(mealToCategories),
	entries: many(mealEntries)
}));

// -------------------------------
// CATEGORIES
// -------------------------------
export const categories = pgTable('categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),

	name: text('name').notNull(),

	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	user: one(user, {
		fields: [categories.userId],
		references: [user.id]
	}),
	meals: many(mealToCategories)
}));

// -------------------------------
// MEAL <-> CATEGORY (MANY-TO-MANY)
// -------------------------------
export const mealToCategories = pgTable('meal_to_categories', {
	id: uuid('id').defaultRandom().primaryKey(),

	mealId: uuid('meal_id')
		.notNull()
		.references(() => meals.id, { onDelete: 'cascade' }),

	categoryId: uuid('category_id')
		.notNull()
		.references(() => categories.id, { onDelete: 'cascade' })
});

export const mealToCategoriesRelations = relations(mealToCategories, ({ one }) => ({
	meal: one(meals, {
		fields: [mealToCategories.mealId],
		references: [meals.id]
	}),
	category: one(categories, {
		fields: [mealToCategories.categoryId],
		references: [categories.id]
	})
}));

// -------------------------------
// MEAL ENTRIES (COOKING LOG)
// -------------------------------
export const mealEntries = pgTable('meal_entries', {
	id: uuid('id').defaultRandom().primaryKey(),

	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),

	mealId: uuid('meal_id')
		.notNull()
		.references(() => meals.id, { onDelete: 'cascade' }),

	dateCooked: date('date_cooked').notNull(),

	notes: text('notes'),
	photoUrls: text('photo_urls').array(), // drizzle supports text array

	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const mealEntriesRelations = relations(mealEntries, ({ one }) => ({
	user: one(user, {
		fields: [mealEntries.userId],
		references: [user.id]
	}),
	meal: one(meals, {
		fields: [mealEntries.mealId],
		references: [meals.id]
	})
}));
