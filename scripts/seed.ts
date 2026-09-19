/**
 * Seeds the database with a demo user and realistic sample data.
 *
 *   pnpm db:seed
 *
 * Re-running is safe: an existing demo user (and all of its data, via cascade)
 * is deleted first, so every run starts from the same fresh state.
 */
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME = 'Demo Koch';
const HISTORY_DAYS = 150;

const env = process.env;
const client = postgres(
	`postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT || 5432}/${env.POSTGRES_DB}`,
	{ onnotice: () => {} }
);
const db = drizzle(client, { schema });

const CATEGORIES = [
	'Pasta',
	'Asiatisch',
	'Vegetarisch',
	'Fleisch',
	'Fisch',
	'Suppen',
	'Schnell',
	'Frühstück'
];

type SampleMeal = {
	title: string;
	categories: string[];
	prepTime: string;
	cookTime: string;
	difficulty: 'easy' | 'medium' | 'hard';
	defaultNotes?: string;
	/** Relative likelihood of being cooked on a given day */
	weight: number;
	/** Preferred weekdays (0 = Sunday); boosts the weight on those days */
	favoriteDays?: number[];
};

const MEALS: SampleMeal[] = [
	{
		title: 'Spaghetti Carbonara',
		categories: ['Pasta', 'Schnell'],
		prepTime: '10 min',
		cookTime: '15 min',
		difficulty: 'easy',
		defaultNotes: 'Guanciale statt Speck, kein Sahne!',
		weight: 5,
		favoriteDays: [5]
	},
	{
		title: 'Lasagne al Forno',
		categories: ['Pasta', 'Fleisch'],
		prepTime: '40 min',
		cookTime: '60 min',
		difficulty: 'hard',
		weight: 2,
		favoriteDays: [0]
	},
	{
		title: 'Penne all’Arrabbiata',
		categories: ['Pasta', 'Vegetarisch', 'Schnell'],
		prepTime: '5 min',
		cookTime: '20 min',
		difficulty: 'easy',
		weight: 4,
		favoriteDays: [5]
	},
	{
		title: 'Pesto Genovese mit Trofie',
		categories: ['Pasta', 'Vegetarisch'],
		prepTime: '15 min',
		cookTime: '12 min',
		difficulty: 'easy',
		weight: 3
	},
	{
		title: 'Rotes Thai Curry',
		categories: ['Asiatisch'],
		prepTime: '15 min',
		cookTime: '25 min',
		difficulty: 'medium',
		defaultNotes: 'Mit Hähnchen oder Tofu',
		weight: 4,
		favoriteDays: [3]
	},
	{
		title: 'Pad Thai',
		categories: ['Asiatisch', 'Schnell'],
		prepTime: '15 min',
		cookTime: '10 min',
		difficulty: 'medium',
		weight: 3
	},
	{
		title: 'Ramen mit Ajitama',
		categories: ['Asiatisch', 'Suppen'],
		prepTime: '30 min',
		cookTime: '3 h',
		difficulty: 'hard',
		weight: 1,
		favoriteDays: [6]
	},
	{
		title: 'Gebratener Reis mit Ei',
		categories: ['Asiatisch', 'Schnell'],
		prepTime: '5 min',
		cookTime: '10 min',
		difficulty: 'easy',
		defaultNotes: 'Am besten mit Reis vom Vortag',
		weight: 4
	},
	{
		title: 'Shakshuka',
		categories: ['Vegetarisch', 'Frühstück'],
		prepTime: '10 min',
		cookTime: '20 min',
		difficulty: 'easy',
		weight: 3,
		favoriteDays: [0, 6]
	},
	{
		title: 'Pancakes mit Ahornsirup',
		categories: ['Frühstück', 'Vegetarisch'],
		prepTime: '10 min',
		cookTime: '15 min',
		difficulty: 'easy',
		weight: 2,
		favoriteDays: [0]
	},
	{
		title: 'Kürbissuppe mit Ingwer',
		categories: ['Suppen', 'Vegetarisch'],
		prepTime: '15 min',
		cookTime: '30 min',
		difficulty: 'easy',
		weight: 2
	},
	{
		title: 'Linsen-Dal',
		categories: ['Vegetarisch', 'Asiatisch'],
		prepTime: '10 min',
		cookTime: '35 min',
		difficulty: 'easy',
		weight: 3,
		favoriteDays: [1]
	},
	{
		title: 'Chili con Carne',
		categories: ['Fleisch'],
		prepTime: '20 min',
		cookTime: '1 h',
		difficulty: 'medium',
		weight: 3,
		favoriteDays: [0]
	},
	{
		title: 'Wiener Schnitzel',
		categories: ['Fleisch'],
		prepTime: '20 min',
		cookTime: '15 min',
		difficulty: 'medium',
		defaultNotes: 'Mit Kartoffelsalat',
		weight: 2,
		favoriteDays: [0]
	},
	{
		title: 'Rinderrouladen',
		categories: ['Fleisch'],
		prepTime: '30 min',
		cookTime: '2 h',
		difficulty: 'hard',
		weight: 1,
		favoriteDays: [0]
	},
	{
		title: 'Lachs mit Ofengemüse',
		categories: ['Fisch'],
		prepTime: '15 min',
		cookTime: '25 min',
		difficulty: 'easy',
		weight: 3,
		favoriteDays: [2]
	},
	{
		title: 'Fish Tacos',
		categories: ['Fisch', 'Schnell'],
		prepTime: '20 min',
		cookTime: '10 min',
		difficulty: 'medium',
		weight: 2
	},
	{
		title: 'Gemüse-Risotto',
		categories: ['Vegetarisch'],
		prepTime: '10 min',
		cookTime: '30 min',
		difficulty: 'medium',
		weight: 2
	},
	{
		title: 'Flammkuchen',
		categories: ['Schnell'],
		prepTime: '15 min',
		cookTime: '12 min',
		difficulty: 'easy',
		weight: 2,
		favoriteDays: [5]
	},
	{
		title: 'Ofenkartoffeln mit Kräuterquark',
		categories: ['Vegetarisch', 'Schnell'],
		prepTime: '10 min',
		cookTime: '45 min',
		difficulty: 'easy',
		weight: 2
	}
];

const ENTRY_NOTES = [
	'Richtig lecker geworden!',
	'Etwas zu salzig, nächstes Mal weniger.',
	'Doppelte Portion gemacht, Reste für morgen.',
	'Mit Freunden gekocht 🎉',
	'Neues Rezept ausprobiert – bleibt!',
	'Mehr Knoblauch nächstes Mal.',
	'Schnell nach der Arbeit gemacht.',
	'Kinder waren begeistert.'
];

/** Small deterministic PRNG (mulberry32) so every seed run produces the same data. */
function createRandom(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function pickWeighted<T>(items: T[], weightOf: (item: T) => number, random: () => number): T {
	const total = items.reduce((sum, item) => sum + weightOf(item), 0);
	let roll = random() * total;
	for (const item of items) {
		roll -= weightOf(item);
		if (roll <= 0) return item;
	}
	return items[items.length - 1];
}

function toDateString(date: Date) {
	return date.toISOString().split('T')[0];
}

async function seed() {
	console.log('Running migrations…');
	await migrate(db, { migrationsFolder: 'drizzle' });

	const deleted = await db.delete(schema.user).where(eq(schema.user.email, DEMO_EMAIL)).returning();
	if (deleted.length > 0) {
		console.log(`Removed existing demo user ${DEMO_EMAIL}`);
	}

	const now = new Date();
	const [demoUser] = await db
		.insert(schema.user)
		.values({ name: DEMO_NAME, email: DEMO_EMAIL, emailVerified: true, timezone: 'Europe/Berlin' })
		.returning();

	// Same credential layout better-auth writes on email sign-up
	await db.insert(schema.account).values({
		accountId: demoUser.id,
		providerId: 'credential',
		userId: demoUser.id,
		password: await hashPassword(DEMO_PASSWORD),
		createdAt: now,
		updatedAt: now
	});

	await db.insert(schema.userSettings).values({ userId: demoUser.id, settings: {} });

	const insertedCategories = await db
		.insert(schema.categories)
		.values(CATEGORIES.map((name) => ({ userId: demoUser.id, name })))
		.returning();
	const categoryIdByName = new Map(insertedCategories.map((c) => [c.name, c.id]));

	const insertedMeals = await db
		.insert(schema.meals)
		.values(
			MEALS.map((m) => ({
				userId: demoUser.id,
				title: m.title,
				prepTime: m.prepTime,
				cookTime: m.cookTime,
				difficulty: m.difficulty,
				defaultNotes: m.defaultNotes ?? null
			}))
		)
		.returning();
	const mealIdByTitle = new Map(insertedMeals.map((m) => [m.title, m.id]));

	await db.insert(schema.mealToCategories).values(
		MEALS.flatMap((m) =>
			m.categories.map((name) => ({
				mealId: mealIdByTitle.get(m.title)!,
				categoryId: categoryIdByName.get(name)!
			}))
		)
	);

	// Cook on ~70% of days, skewed towards each meal's favourite weekdays,
	// so the analytics and day-of-week suggestions have patterns to show.
	const random = createRandom(42);
	const entries: (typeof schema.mealEntries.$inferInsert)[] = [];
	for (let daysAgo = HISTORY_DAYS; daysAgo >= 0; daysAgo--) {
		if (random() > 0.7 && daysAgo !== 0) continue;

		const day = new Date(now);
		day.setDate(day.getDate() - daysAgo);
		const weekday = day.getDay();

		const meal = pickWeighted(
			MEALS,
			(m) => m.weight * (m.favoriteDays?.includes(weekday) ? 4 : 1),
			random
		);
		entries.push({
			userId: demoUser.id,
			mealId: mealIdByTitle.get(meal.title)!,
			dateCooked: toDateString(day),
			notes: random() < 0.3 ? ENTRY_NOTES[Math.floor(random() * ENTRY_NOTES.length)] : null,
			photoUrls: []
		});
	}
	await db.insert(schema.mealEntries).values(entries);

	console.log(
		`Seeded ${CATEGORIES.length} categories, ${MEALS.length} meals and ${entries.length} entries.`
	);
	console.log(`Log in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

try {
	await seed();
} catch (error) {
	console.error('Seeding failed:', error);
	process.exitCode = 1;
} finally {
	await client.end();
}
