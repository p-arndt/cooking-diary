import { building } from '$app/environment';
import { db } from '$lib/server/db';
import { redirect, type Handle, type ServerInit } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { auth } from './auth';

export const init: ServerInit = async () => {
	try {
		await db.execute(`SELECT NOW()`);
		console.log('Database connected successfully');
	} catch (error) {
		console.error('Failed to connect to database:', error);
		throw error;
	}

	await migrate(db, { migrationsFolder: 'drizzle' });
	console.log('Migrations completed successfully');
};

export const betterAuthHandle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const authHandle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	const urlPathname = event.url.pathname;

	if (!session?.user?.id && urlPathname !== '/login' && urlPathname !== '/register') {
		return redirect(302, '/login');
	}

	if (session?.user?.id && (urlPathname === '/login' || urlPathname === '/register')) {
		return redirect(302, '/');
	}

	return resolve(event);
};

export const handle = sequence(betterAuthHandle, authHandle);
