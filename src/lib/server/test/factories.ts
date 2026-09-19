import { db } from '$lib/server/db';
import { categories, mealEntries, meals, user } from '$lib/server/db/schema';

// Every test creates its own users, so tests never share rows and can run in any order.
export async function createUser(name = 'Test User') {
	const id = crypto.randomUUID();
	const [row] = await db
		.insert(user)
		.values({ id, name, email: `${id}@example.test`, emailVerified: false })
		.returning();
	return row;
}

export async function createCategory(userId: string, name = 'Category') {
	const [row] = await db.insert(categories).values({ userId, name }).returning();
	return row;
}

export async function createMeal(userId: string, title = 'Meal') {
	const [row] = await db.insert(meals).values({ userId, title }).returning();
	return row;
}

export async function createEntry(userId: string, mealId: string, dateCooked = '2026-01-01') {
	const [row] = await db
		.insert(mealEntries)
		.values({ userId, mealId, dateCooked, photoUrls: [] })
		.returning();
	return row;
}
