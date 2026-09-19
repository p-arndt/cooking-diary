import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const user = encodeURIComponent(env.POSTGRES_USER ?? '');
const password = encodeURIComponent(env.POSTGRES_PASSWORD ?? '');

export const DATABASE_URL = `postgres://${user}:${password}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT || 5432}/${env.POSTGRES_DB}`;

// The tables use `timestamp without time zone` with `DEFAULT now()`, whose stored wall
// time follows the session time zone, while drizzle reads those columns back as UTC.
const client = postgres(DATABASE_URL, { connection: { TimeZone: 'UTC' } });

export const db = drizzle(client, { schema });
