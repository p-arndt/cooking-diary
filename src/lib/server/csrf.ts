import { json, text } from '@sveltejs/kit';

/**
 * Content types a browser can send cross-site without a CORS preflight, i.e. what a plain
 * HTML form can submit, plus SvelteKit's own binary form encoding.
 */
const FORM_CONTENT_TYPES = [
	'application/x-www-form-urlencoded',
	'multipart/form-data',
	'text/plain',
	'application/x-sveltekit-formdata'
];

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Better Auth names its session cookie `better-auth.session_token`, with a `__Secure-` prefix
 * when served over HTTPS.
 */
const SESSION_COOKIE = /(?:^|;)\s*(?:__Secure-|__Host-)?better-auth\.session_token=/;

const BEARER = /^Bearer\s+\S/i;

function isFormContentType(request: Request): boolean {
	const type = request.headers.get('content-type')?.split(';', 1)[0].trim() ?? '';
	return FORM_CONTENT_TYPES.includes(type.toLowerCase());
}

/**
 * Browsers cannot attach an Authorization header to a cross-site request without a CORS
 * preflight, and this app never grants one, so a bearer request cannot be forged by another
 * site. That only holds while the bearer token is the sole credential: once the session cookie
 * rides along too, the server might authenticate with the cookie instead.
 */
export function isBearerOnlyRequest(request: Request): boolean {
	const authorization = request.headers.get('authorization');
	if (!authorization || !BEARER.test(authorization)) return false;
	return !SESSION_COOKIE.test(request.headers.get('cookie') ?? '');
}

/**
 * Mirrors SvelteKit's built-in origin check (`csrf.trustedOrigins`), which is switched off in
 * svelte.config.js because it rejects the native app's bearer-authenticated multipart uploads,
 * which carry no Origin header. Bearer-only requests are the single exception.
 */
export function isForbiddenCrossSiteRequest(
	request: Request,
	url: URL,
	trustedOrigins: readonly string[] = []
): boolean {
	if (!STATE_CHANGING_METHODS.has(request.method)) return false;
	if (!isFormContentType(request)) return false;

	const origin = request.headers.get('origin');
	if (origin === url.origin) return false;
	if (origin && trustedOrigins.includes(origin)) return false;

	return !isBearerOnlyRequest(request);
}

/** Same status, message and content negotiation as SvelteKit's own CSRF rejection. */
export function forbiddenCrossSiteResponse(request: Request): Response {
	const message = `Cross-site ${request.method} form submissions are forbidden`;
	const init = { status: 403 };

	if (request.headers.get('accept') === 'application/json') {
		return json({ message }, init);
	}

	return text(message, init);
}
