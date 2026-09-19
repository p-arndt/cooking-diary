/**
 * Parses the comma-separated `TRUSTED_PROXIES` value into the list Better Auth expects.
 * Without it, a request that passed through a reverse proxy carries more than one address
 * in `X-Forwarded-For`, Better Auth refuses to guess which one is the client, and every
 * request shares one rate-limit bucket.
 */
export function parseTrustedProxies(value: string | undefined): string[] {
	return (value ?? '')
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
}
