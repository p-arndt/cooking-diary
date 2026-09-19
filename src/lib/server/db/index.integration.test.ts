import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from './index';

describe('db client', () => {
	it('pins the session time zone to UTC', async () => {
		const [row] = await db.execute<{ TimeZone: string }>(sql`SHOW TimeZone`);
		expect(row.TimeZone).toBe('UTC');
	});
});
