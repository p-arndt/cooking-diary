import { building, dev } from '$app/environment';
import { db } from '$lib/server/db';
import { json, redirect, type Handle, type ServerInit } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { auth } from './auth';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { forbiddenCrossSiteResponse, isForbiddenCrossSiteRequest } from '$lib/server/csrf';
import { injectCspNonce, securityHeadersHandle } from '$lib/server/security-headers';

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

// SvelteKit's own check is disabled in svelte.config.js; like it, this one only runs in production.
export const csrfHandle: Handle = ({ event, resolve }) => {
	if (!dev && isForbiddenCrossSiteRequest(event.request, event.url)) {
		return forbiddenCrossSiteResponse(event.request);
	}
	return resolve(event);
};

export const betterAuthHandle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = session?.session ?? null;
	event.locals.user = session?.user ?? null;

	return svelteKitHandler({ event, resolve, auth, building });
};

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/healthz'];

export const authHandle: Handle = async ({ event, resolve }) => {
	const userId = event.locals.user?.id;
	const urlPathname = event.url.pathname;

	if (!userId && urlPathname.startsWith('/api/')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!userId && !publicPaths.includes(urlPathname)) {
		return redirect(302, '/login');
	}

	if (userId && (urlPathname === '/login' || urlPathname === '/register')) {
		return redirect(302, '/');
	}

	return resolve(event);
};

const paraglideHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
		event.request = localizedRequest;
		return resolve(event, {
			transformPageChunk: ({ html }) => {
				return injectCspNonce(html.replace('%lang%', locale));
			}
		});
	});

export const handle = sequence(
	securityHeadersHandle,
	csrfHandle,
	betterAuthHandle,
	authHandle,
	paraglideHandle
);
