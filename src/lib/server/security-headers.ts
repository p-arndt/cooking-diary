import { isRedirect, type Handle } from '@sveltejs/kit';
import { errorResponse, recordCookieWrites, redirectResponse } from './thrown-response';

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'DENY',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

/** Returns the security headers the response does not set itself, so route-specific values win. */
export function missingSecurityHeaders(headers: Headers): [string, string][] {
	return Object.entries(SECURITY_HEADERS).filter(([name]) => !headers.has(name));
}

export function withSecurityHeaders(response: Response): Response {
	const missing = missingSecurityHeaders(response.headers);
	if (missing.length === 0) return response;

	try {
		for (const [name, value] of missing) response.headers.set(name, value);
		return response;
	} catch {
		// Responses from fetch() or Response.redirect() have immutable headers.
		const copy = new Response(response.body, response);
		for (const [name, value] of missing) copy.headers.set(name, value);
		return copy;
	}
}

/**
 * Runs first in the handle sequence. Redirects and errors thrown by later handles would
 * otherwise escape to SvelteKit, which builds those responses after every hook has returned,
 * so they are turned into responses here where the headers can still be added.
 */
export const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	const cookieWrites = recordCookieWrites(event.cookies);

	try {
		return withSecurityHeaders(await resolve(event));
	} catch (error) {
		if (!isRedirect(error)) return withSecurityHeaders(errorResponse(event, error));

		const response = redirectResponse(event, error);
		for (const cookie of cookieWrites()) response.headers.append('set-cookie', cookie);
		return withSecurityHeaders(response);
	}
};

const CSP_NONCE_PLACEHOLDER = 'nonce=%csp.nonce%';
const SVELTEKIT_NONCE = /<script nonce="([^"]+)"/;

/**
 * SvelteKit only substitutes %sveltekit.nonce% in app.html, but mode-watcher renders its
 * inline theme script from a component. It gets a placeholder that is swapped here for the
 * nonce SvelteKit put on its own bootstrap script in the same document.
 */
export function injectCspNonce(html: string): string {
	if (!html.includes(CSP_NONCE_PLACEHOLDER)) return html;
	const nonce = SVELTEKIT_NONCE.exec(html)?.[1];
	return html.replaceAll(CSP_NONCE_PLACEHOLDER, nonce ? `nonce="${nonce}"` : '');
}
