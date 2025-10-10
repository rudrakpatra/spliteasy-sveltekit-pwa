import jwt from 'jsonwebtoken';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { error, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { UserId } from '$lib/schemas/user';
import type { Email } from '$lib/schemas/email';

export interface JWTPayload {
	userId: UserId;
	email: Email;
	name: string;
	image?: string;
	iat?: number;
	exp?: number;
}

export interface AuthUser {
	id: UserId;
	name: string;
	email: Email;
	image?: string;
	email_verified: boolean;
	exp: number;
}

// Token expiration time (30 days)
const TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Creates a JWT token for the user
 */
export function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
	return jwt.sign(payload, env.JWT_SECRET, {
		expiresIn: TOKEN_EXPIRY,
	});
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyJWT(token: string): JWTPayload | null {
	try {
		return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
	} catch (error) {
		console.error('JWT verification failed:', error);
		return null;
	}
}

/**
 * Creates a user session JWT token
 */
export function createUserSession(user: AuthUser): string {
	return createJWT({
		userId: user.id,
		email: user.email,
		name: user.name,
		image: user.image,
	});
}

/**
 * Validates a user session and syncs with database
 */
export async function validateUserSession(token: string): Promise<{ user: AuthUser | null; valid: boolean }> {
	const payload = verifyJWT(token);

	if (!payload) {
		return { user: null, valid: false };
	}

	try {
		// Check if user exists in database
		const [dbUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, payload.userId))
			.limit(1);

		if (!dbUser) {
			return { user: null, valid: false };
		}

		// Create user object from database
		const user: AuthUser = {
			id: dbUser.id,
			name: dbUser.name,
			email: dbUser.email,
			email_verified: dbUser.email_verified,
			image: dbUser.img || undefined,
			exp: payload.exp || 0,
		};

		return { user, valid: true };
	} catch (error) {
		console.error('Database validation failed:', error);
		return { user: null, valid: false };
	}
}

/**
 * Syncs user data with database (creates or updates user)
 */
export async function syncUserWithDatabase(userData: AuthUser): Promise<void> {
	try {
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, userData.id))
			.limit(1);

		if (existingUser) {
			// Update existing user
			await db
				.update(users)
				.set({
					name: userData.name,
					email: userData.email,
					img: userData.image || null,
					email_verified: true,
				})
				.where(eq(users.id, userData.id));
		} else {
			// Create new user
			await db.insert(users).values({
				id: userData.id,
				name: userData.name,
				email: userData.email,
				img: userData.image || null,
				email_verified: true,
			});
		}
	} catch (error) {
		console.error('Failed to sync user with database:', error);
		throw error;
	}
}

/**
 * Extracts JWT token from Authorization header or cookies
 */
export function extractToken(event: { request?: Request; cookies?: { get: (name: string) => string | undefined } }): string | null {
	// Try Authorization header first
	if (event.request) {
		const authHeader = event.request.headers.get('Authorization');
		if (authHeader?.startsWith('Bearer ')) {
			return authHeader.substring(7);
		}
	}

	// Try cookies
	if (event.cookies?.get) {
		return event.cookies.get('auth-token') || null;
	}

	return null;
}

/**
 * Sets JWT token in cookie
 */
export function setAuthTokenCookie(event: RequestEvent, token: string): void {
	event.cookies.set('auth-token', token, {
		path: '/',
		expires: new Date(Date.now() + TOKEN_EXPIRY * 1000), // Convert to milliseconds
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax'
	});
}

/**
 * Clears JWT token from cookie
 */
export function clearAuthTokenCookie(event: RequestEvent): void {
	event.cookies.set('auth-token', '', {
		path: '/',
		expires: new Date(0),
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax'
	});
}

/**
 * Throws an error if the user is not authenticated
 * @param event - The request event
 * @returns The authenticated user
 */
export function requireAuth(event: RequestEvent): AuthUser {
	if (!event.locals.user) {
		throw error(401, {
			message: 'Unauthorized',
		});
	}
	return event.locals.user;
}

/**
 * Throws an error if the provided API key is invalid
 * @param event - The request event
 * @param validKey - The valid API key
 */
export function requireApiKey(event: RequestEvent, validKey: string): void {
	const authHeader = event.request.headers.get('Authorization');
	const providedKey = authHeader?.replace('Bearer ', '');

	if (providedKey !== validKey) {
		throw error(401, {
			message: 'Invalid API key',
		});
	}
}