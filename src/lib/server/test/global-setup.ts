import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { TestProject } from 'vitest/node';

let container: StartedPostgreSqlContainer | undefined;

declare module 'vitest' {
	export interface ProvidedContext {
		dbEnv: Record<string, string>;
	}
}

// One container per run. The connection settings are handed to the workers through
// provide(); setup-env.ts swaps them into $env/dynamic/private, because SvelteKit
// snapshots that module from .env at startup, before this container exists.
export async function setup(project: TestProject) {
	container = await new PostgreSqlContainer('postgres:17').start();

	project.provide('dbEnv', {
		POSTGRES_HOST: container.getHost(),
		POSTGRES_PORT: String(container.getPort()),
		POSTGRES_USER: container.getUsername(),
		POSTGRES_PASSWORD: container.getPassword(),
		POSTGRES_DB: container.getDatabase()
	});

	const client = postgres(container.getConnectionUri(), { max: 1 });
	await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
	await client.end();
}

export async function teardown() {
	await container?.stop();
}
