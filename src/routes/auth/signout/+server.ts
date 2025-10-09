import { redirect } from '@sveltejs/kit';
import { clearAuthTokenCookie } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent): Promise<Response> {
	clearAuthTokenCookie(event);
	return redirect(302, '/');
}

export async function GET(event: RequestEvent): Promise<Response> {
	clearAuthTokenCookie(event);
	return redirect(302, '/');
}
