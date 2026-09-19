import { describe, expect, it } from 'vitest';
import { GET } from './+server';

describe('GET /healthz', () => {
	it('reports ok when the database answers', async () => {
		const response = await GET({} as Parameters<typeof GET>[0]);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: 'ok' });
	});
});
