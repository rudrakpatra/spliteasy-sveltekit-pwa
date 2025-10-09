import { redirect } from '@sveltejs/kit';
import { google, type GoogleUser, generateState, generateCodeVerifier } from '$lib/server/google-oauth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createUserSession, setAuthTokenCookie } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent): Promise<Response> {
    const code = event.url.searchParams.get('code');
    const state = event.url.searchParams.get('state');
    const storedState = event.cookies.get('google_oauth_state');
    const codeVerifier = event.cookies.get('google_code_verifier');
    const redirectTo = event.cookies.get('oauth_redirect_to'); // Get from cookie

    // Initiate OAuth flow
    if (!code) {
        const state = generateState();
        const codeVerifier = generateCodeVerifier();
        const redirectParam = event.url.searchParams.get('redirect_to');
        const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

        // Store OAuth state and verifier
        event.cookies.set('google_oauth_state', state, {
            path: '/',
            httpOnly: true,
            maxAge: 60 * 10,
            sameSite: 'lax'
        });

        event.cookies.set('google_code_verifier', codeVerifier, {
            path: '/',
            httpOnly: true,
            maxAge: 60 * 10,
            sameSite: 'lax'
        });

        // Store redirect destination in cookie
        if (redirectParam) {
            event.cookies.set('oauth_redirect_to', redirectParam, {
                path: '/',
                httpOnly: true,
                maxAge: 60 * 10,
                sameSite: 'lax'
            });
        }

        return redirect(302, url.toString());
    }

    // Validate CSRF state
    if (!state || !storedState || state !== storedState || !codeVerifier) {
        return redirect(302, '/auth/signin?error=invalid_state');
    }

    try {
        // Exchange code for tokens and fetch user info
        const tokens = await google.validateAuthorizationCode(code, codeVerifier);
        const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${tokens.accessToken()}` }
        });
        const googleUser: GoogleUser = await response.json();

        // Upsert user in database
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, googleUser.email))
            .limit(1);

        if (existingUser) {
            await db
                .update(users)
                .set({
                    name: googleUser.name,
                    img: googleUser.picture,
                    email_verified: googleUser.email_verified
                })
                .where(eq(users.id, existingUser.id));
        } else {
            await db.insert(users).values({
                id: googleUser.sub,
                email: googleUser.email,
                name: googleUser.name,
                img: googleUser.picture,
                email_verified: googleUser.email_verified
            });
        }

        // Create session
        const sessionToken = createUserSession({
            id: googleUser.sub,
            name: googleUser.name,
            email: googleUser.email,
            image: googleUser.picture,
            email_verified: googleUser.email_verified
        });

        setAuthTokenCookie(event, sessionToken);

        // Clear OAuth cookies
        event.cookies.delete('google_oauth_state', { path: '/' });
        event.cookies.delete('google_code_verifier', { path: '/' });
        event.cookies.delete('oauth_redirect_to', { path: '/' }); // Clear redirect cookie

    } catch (error) {
        console.error('Google OAuth error:', error);
        return redirect(302, '/auth/signin?error=auth_failed');
    }

    // Success redirect with stored destination
    return redirect(302, redirectTo || '/');
}
