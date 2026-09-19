import type { Handle } from '@sveltejs/kit';

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
 * Runs first in the handle sequence, so the headers also cover responses that later handles
 * produce. Redirects and errors thrown from a handle bypass this: SvelteKit builds those
 * responses itself, and they carry no content worth protecting.
 */
export const securityHeadersHandle: Handle = async ({ event, resolve }) =>
	withSecurityHeaders(await resolve(event));

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
