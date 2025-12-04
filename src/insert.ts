
import { db } from '$lib/server/db';
import { categories, meals, mealToCategories, mealEntries } from '$lib/server/db/schema';
import clean from '../clean_full.json' assert { type: 'json' };

const USER_ID = '6f3deb99-f0b5-41b7-8407-f8d49be2f3fc';

async function importAll() {
	// --- Maps old IDs -> new UUIDs ---
	const categoryIdMap = new Map<number, string>();
	const mealIdMap = new Map<number, string>();

	// ================================
	// 1) INSERT CATEGORIES
	// ================================
	for (const c of clean.dishTypes) {
		const id = crypto.randomUUID();
		categoryIdMap.set(c.dishTypeId, id);

		await db.insert(categories).values({
			id,
			userId: USER_ID,
			name: c.typeName
		});
	}

	// ================================
	// 2) INSERT MEALS
	// ================================
	for (const m of clean.dishes) {
		const id = crypto.randomUUID();
		mealIdMap.set(m.dishId, id);

		await db.insert(meals).values({
			id,
			userId: USER_ID,
			title: m.name,
			defaultNotes: null,
			defaultPhotoUrl: null
		});

		// link meal to category
		await db.insert(mealToCategories).values({
			id: crypto.randomUUID(),
			mealId: id,
			categoryId: categoryIdMap.get(m.dishTypeId)!
		});
	}

	// ================================
	// 3) INSERT MEAL ENTRIES (history)
	// ================================
	for (const h of clean.history) {
		const mealId = mealIdMap.get(h.fkDishId);
		if (!mealId) continue;

		// normalize cookedAt string → date
		// "25::Juni::2022 19::01::04"
		const cooked = normalizeCookedAt(h.cookedAt);

		await db.insert(mealEntries).values({
			id: crypto.randomUUID(),
			userId: USER_ID,
			mealId,
			dateCooked: cooked,
			notes: null,
			photoUrls: []
		});
	}

	console.log('IMPORT DONE');
}

// ================================
// DATE NORMALIZER
// ================================
function normalizeCookedAt(s: string): string {
	// Example: "25::Juni::2022 19::01::04"
	// Step 1: replace "::" with " "
	let cleaned = s.replace(/::/g, ' ').trim();

	// Step 2: convert "Juni" -> "June"
	const months: Record<string, string> = {
		Januar: 'January',
		Februar: 'February',
		März: 'March',
		April: 'April',
		Mai: 'May',
		Juni: 'June',
		Juli: 'July',
		August: 'August',
		September: 'September',
		Oktober: 'October',
		November: 'November',
		Dezember: 'December'
	};

	for (const m of Object.keys(months)) {
		cleaned = cleaned.replace(m, months[m]);
	}

	// Step 3: return a standard YYYY-MM-DD
	return new Date(cleaned).toISOString().substring(0, 10);
}

importAll();
