import { env } from '$env/dynamic/private';
import { isSignupDisabled } from '$lib/server/auth/signup';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { signupDisabled: isSignupDisabled(env.DISABLE_SIGNUP) };
};
