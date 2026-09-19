export function isSignupDisabled(value: string | undefined): boolean {
	return ['true', '1', 'yes'].includes(value?.trim().toLowerCase() ?? '');
}
