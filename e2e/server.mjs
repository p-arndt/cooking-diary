/**
 * Boots the app the way Playwright's `webServer` needs it:
 *
 *   1. a throwaway Postgres through Testcontainers (same image as the vitest setup),
 *   2. the drizzle migrations from ./drizzle,
 *   3. the adapter-node build, started in a temp working directory so uploaded
 *      files land there instead of in the repo.
 *
 * Playwright starts `webServer` before `globalSetup`, so the database cannot be
 * handed over through `globalSetup`; this wrapper owns the whole lifetime instead.
 */
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { randomBytes } from 'node:crypto';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import postgres from 'postgres';

const repoRoot = new URL('..', import.meta.url).pathname;
const port = process.env.PORT ?? '4300';

const container = await new PostgreSqlContainer('postgres:17').start();

// hooks.server.ts re-runs the migrations from the server's working directory on boot.
const runDir = mkdtempSync(join(tmpdir(), 'cooking-diary-e2e-'));
cpSync(join(repoRoot, 'drizzle'), join(runDir, 'drizzle'), { recursive: true });

const stop = async () => {
	rmSync(runDir, { recursive: true, force: true });
	await container.stop().catch(() => {});
	process.exit(0);
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);

const client = postgres(container.getConnectionUri(), { max: 1 });
await migrate(drizzle(client), { migrationsFolder: join(repoRoot, 'drizzle') });
await client.end();

Object.assign(process.env, {
	POSTGRES_HOST: container.getHost(),
	POSTGRES_PORT: String(container.getPort()),
	POSTGRES_USER: container.getUsername(),
	POSTGRES_PASSWORD: container.getPassword(),
	POSTGRES_DB: container.getDatabase(),
	PORT: port,
	ORIGIN: `http://localhost:${port}`,
	BETTER_AUTH_URL: `http://localhost:${port}`,
	BETTER_AUTH_SECRET: randomBytes(16).toString('hex')
	// NODE_ENV is deliberately left alone: better-auth turns its rate limiter on for
	// production (3 sign-ups per 10s and IP), which no parallel suite can satisfy. The
	// build itself is still the production one, so `dev` is false inside the app.
});

process.chdir(runDir);
await import(join(repoRoot, 'build', 'index.js'));
