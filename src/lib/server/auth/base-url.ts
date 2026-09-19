export type PublicBaseUrlInput = {
	betterAuthUrl?: string;
	origin?: string;
	dev: boolean;
	requestUrl?: string;
};

function toOrigin(value: string | undefined): string | null {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	try {
		const url = new URL(trimmed);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url.origin;
	} catch {
		return null;
	}
}

/**
 * Resolves the public origin used in links sent to users. Outside of dev the request origin
 * is never used: with adapter-node and no ORIGIN it comes from the client-controlled Host
 * header, which would let anyone send reset links pointing at their own server.
 */
export function resolvePublicBaseUrl({
	betterAuthUrl,
	origin,
	dev,
	requestUrl
}: PublicBaseUrlInput): string | null {
	const configured = toOrigin(betterAuthUrl) ?? toOrigin(origin);
	if (configured) return configured;
	return dev ? toOrigin(requestUrl) : null;
}
