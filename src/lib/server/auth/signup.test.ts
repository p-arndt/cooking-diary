import { describe, expect, it } from 'vitest';
import { isSignupDisabled } from './signup';

describe('isSignupDisabled', () => {
	it('keeps signup open by default', () => {
		expect(isSignupDisabled(undefined)).toBe(false);
		expect(isSignupDisabled('')).toBe(false);
		expect(isSignupDisabled('false')).toBe(false);
		expect(isSignupDisabled('0')).toBe(false);
	});

	it('disables signup for truthy values', () => {
		expect(isSignupDisabled('true')).toBe(true);
		expect(isSignupDisabled(' TRUE ')).toBe(true);
		expect(isSignupDisabled('1')).toBe(true);
		expect(isSignupDisabled('yes')).toBe(true);
	});
});
