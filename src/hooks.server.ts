import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

const handleAuth: Handle = async ({ event, resolve }) => {
	// Try to get JWT token from cookies
	const token = event.cookies.get('auth-token');

	if (!token) {
		event.locals.user = null;
		return resolve(event);
	}

	// Validate JWT token
	const { user, valid } = await auth.validateUserSession(token);

	if (valid && user) {
		event.locals.user = user;
	} else {
		event.locals.user = null;
		// Clear invalid token
		auth.clearAuthTokenCookie(event);
	}

	return resolve(event);
};

export const handle: Handle = handleAuth;
