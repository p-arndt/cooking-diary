import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

let container: StartedPostgreSqlContainer | undefined;

// One container per run. The env vars are set before the workers fork, so
// $lib/server/db connects to the container exactly as it would in production.
export async function setup() {
	container = await new PostgreSqlContainer('postgres:17').start();

	process.env.POSTGRES_HOST = container.getHost();
	process.env.POSTGRES_PORT = String(container.getPort());
	process.env.POSTGRES_USER = container.getUsername();
	process.env.POSTGRES_PASSWORD = container.getPassword();
	process.env.POSTGRES_DB = container.getDatabase();

	const client = postgres(container.getConnectionUri(), { max: 1 });
	await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
	await client.end();
}

export async function teardown() {
	await container?.stop();
}
