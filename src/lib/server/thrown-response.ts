import {
	isHttpError,
	json,
	text,
	type Cookies,
	type Redirect,
	type RequestEvent
} from '@sveltejs/kit';

/**
 * Picks the entry of `types` the Accept header prefers, using the same ranking SvelteKit uses
 * (q-value, then specificity, then header order).
 */
export function negotiate(accept: string, types: readonly string[]): string | undefined {
	const parts: { type: string; subtype: string; q: number; i: number }[] = [];

	accept.split(',').forEach((part, i) => {
		const match = /([^/ \t]+)\/([^; \t]+)[ \t]*(?:;[ \t]*q=([0-9.]+))?/.exec(part);
		if (match) {
			const [, type, subtype, q = '1'] = match;
			parts.push({ type, subtype, q: +q, i });
		}
	});

	parts.sort((a, b) => {
		if (a.q !== b.q) return b.q - a.q;
		if ((a.subtype === '*') !== (b.subtype === '*')) return a.subtype === '*' ? 1 : -1;
		if ((a.type === '*') !== (b.type === '*')) return a.type === '*' ? 1 : -1;
		return a.i - b.i;
	});

	let accepted: string | undefined;
	let minPriority = Infinity;

	for (const mimetype of types) {
		const [type, subtype] = mimetype.split('/');
		const priority = parts.findIndex(
			(part) =>
				(part.type === type || part.type === '*') &&
				(part.subtype === subtype || part.subtype === '*')
		);
		if (priority !== -1 && priority < minPriority) {
			accepted = mimetype;
			minPriority = priority;
		}
	}

	return accepted;
}

/**
 * The response SvelteKit itself would send for a `redirect()` thrown from `handle`: client-side
 * navigations and `use:enhance` form submissions expect a JSON envelope instead of a 3xx.
 * SvelteKit only uses the action envelope for page routes; handles here only redirect page
 * requests (API routes answer 401), so every JSON-accepting POST is treated as a form action.
 */
export function redirectResponse(event: RequestEvent, redirect: Redirect): Response {
	const { status, location } = redirect;

	if (event.isDataRequest || event.isRemoteRequest) {
		return json({ type: 'redirect', location });
	}

	const accept = event.request.headers.get('accept') ?? '*/*';
	if (
		event.request.method === 'POST' &&
		negotiate(accept, ['application/json', 'text/html']) === 'application/json'
	) {
		return json({ type: 'redirect', status, location });
	}

	return new Response(undefined, { status, headers: { location } });
}

/**
 * The response for an error thrown from `handle`, shaped like SvelteKit's fatal error response
 * (JSON `{ message }` when JSON is preferred) but as plain text instead of the error template,
 * which hooks cannot render.
 */
export function errorResponse(event: RequestEvent, error: unknown): Response {
	let status = 500;
	let message = 'Internal Error';

	if (isHttpError(error)) {
		status = error.status;
		message = error.body.message;
	} else {
		console.error(error);
	}

	const accept = event.request.headers.get('accept') || 'text/html';
	if (
		event.isDataRequest ||
		negotiate(accept, ['application/json', 'text/html']) === 'application/json'
	) {
		return json({ message }, { status });
	}

	return text(message, { status });
}

/**
 * SvelteKit only attaches cookies written via `event.cookies` to responses that pass through
 * `resolve()` or to redirects it catches itself. When a handle builds the response for a thrown
 * redirect, it has to replay those writes (e.g. Better Auth clearing a stale session cookie).
 * Returns a function listing the serialized Set-Cookie values written so far.
 */
export function recordCookieWrites(cookies: Cookies): () => string[] {
	const writes = new Map<string, string>();
	const set = cookies.set.bind(cookies);
	const remove = cookies.delete.bind(cookies);
	const key = (name: string, options: { path: string; domain?: string }) =>
		`${options.domain ?? ''}${options.path}?${name}`;

	cookies.set = (name, value, options) => {
		set(name, value, options);
		writes.set(key(name, options), cookies.serialize(name, value, options));
	};
	cookies.delete = (name, options) => {
		remove(name, options);
		writes.set(key(name, options), cookies.serialize(name, '', { ...options, maxAge: 0 }));
	};

	return () => [...writes.values()];
}
