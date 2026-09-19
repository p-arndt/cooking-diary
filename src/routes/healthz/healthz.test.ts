import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: { execute: vi.fn().mockRejectedValue(new Error('password authentication failed')) }
}));

const { GET } = await import('./+server');

describe('GET /healthz without a database', () => {
	it('answers 503 without leaking the error', async () => {
		const response = await GET({} as Parameters<typeof GET>[0]);
		expect(response.status).toBe(503);
		expect(await response.text()).toBe(JSON.stringify({ status: 'unavailable' }));
	});
});
