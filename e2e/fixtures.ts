import { expect, test as base, type Browser, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export type TestUser = {
	name: string;
	email: string;
	password: string;
};

/**
 * Creates and signs in a brand new account through better-auth. The request goes through
 * `page.request`, which shares the browser context's cookie jar, so the page is logged in
 * afterwards without driving the sign-up form.
 */
async function signUp(page: Page, origin: string): Promise<TestUser> {
	const user = {
		name: 'E2E Tester',
		email: `e2e-${randomUUID()}@example.com`,
		password: 'e2e-password-123'
	};
	const response = await page.request.post('/api/auth/sign-up/email', {
		data: user,
		headers: { Origin: origin }
	});
	expect(response.status(), await response.text()).toBe(200);
	return user;
}

/** Thin wrapper around the v1 REST API, used to arrange state a UI journey needs. */
export class ApiClient {
	constructor(
		private readonly page: Page,
		private readonly origin: string
	) {}

	private async post(path: string, data: unknown) {
		// The server rejects same-site-less writes, so the browser's Origin has to be sent
		// explicitly: APIRequestContext does not add one on its own.
		const response = await this.page.request.post(path, {
			data,
			headers: { Origin: this.origin }
		});
		expect(response.status(), await response.text()).toBe(201);
		return response.json();
	}

	createCategory(name: string): Promise<{ id: string; name: string }> {
		return this.post('/api/v1/categories', { name });
	}

	createMeal(meal: {
		title: string;
		categoryIds?: string[];
		prepTime?: string;
		cookTime?: string;
		difficulty?: 'easy' | 'medium' | 'hard';
	}): Promise<{ id: string; title: string }> {
		return this.post('/api/v1/meals', meal);
	}

	createEntry(entry: { mealId: string; dateCooked: string; notes?: string }): Promise<{
		id: string;
		notes: string | null;
		photoUrls: string[] | null;
	}> {
		return this.post('/api/v1/entries', entry);
	}

	async meals(query?: string) {
		const response = await this.page.request.get(
			query ? `/api/v1/meals?q=${encodeURIComponent(query)}` : '/api/v1/meals'
		);
		expect(response.status()).toBe(200);
		return (await response.json()).meals as Array<{
			id: string;
			title: string;
			defaultPhotoUrl: string | null;
		}>;
	}

	async entries(limit = 50) {
		const response = await this.page.request.get(`/api/v1/entries?limit=${limit}`);
		expect(response.status()).toBe(200);
		return (await response.json()).entries as Array<{
			id: string;
			notes: string | null;
			photoUrls: string[] | null;
		}>;
	}
}

type Fixtures = {
	/** A fresh, signed-in account. Every test gets its own, so tests stay independent. */
	user: TestUser;
	api: ApiClient;
};

export const test = base.extend<Fixtures>({
	context: async ({ context, baseURL }, use) => {
		// paraglide resolves the locale from this cookie first; pin it so the accessible
		// names the tests use stay English regardless of the negotiated language.
		await context.addCookies([{ name: 'PARAGLIDE_LOCALE', value: 'en', url: baseURL! }]);
		await use(context);
	},
	user: async ({ page, baseURL }, use) => {
		await use(await signUp(page, baseURL!));
	},
	api: async ({ page, baseURL, user }, use) => {
		void user; // the API client needs the session the user fixture establishes
		await use(new ApiClient(page, baseURL!));
	}
});

/**
 * Runs `fn` as a different signed-in account in its own browser context, so the calling
 * test keeps its own session. Used for the ownership checks.
 */
export async function withOtherUser<T>(
	browser: Browser,
	baseURL: string,
	fn: (page: Page) => Promise<T>
): Promise<T> {
	const context = await browser.newContext({ baseURL });
	try {
		const page = await context.newPage();
		await signUp(page, baseURL);
		return await fn(page);
	} finally {
		await context.close();
	}
}

export { expect };
