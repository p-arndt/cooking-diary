import { describe, expect, it } from 'vitest';
import { parseTrustedProxies } from './trusted-proxies';

describe('parseTrustedProxies', () => {
	it('returns an empty list when unset or blank', () => {
		expect(parseTrustedProxies(undefined)).toEqual([]);
		expect(parseTrustedProxies('  ,  ')).toEqual([]);
	});

	it('splits addresses and CIDR ranges, trimming whitespace', () => {
		expect(parseTrustedProxies('127.0.0.1, 10.0.0.0/8 ,::1')).toEqual([
			'127.0.0.1',
			'10.0.0.0/8',
			'::1'
		]);
	});
});
