import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { loginSchema, type LoginSchema } from '$lib/schemas/auth';
import type { Actions, PageServerLoad } from './$types';


export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/demo/lucia');
	}
	const form = await superValidate(event, zod4(loginSchema));
	return { form };
};

export const actions: Actions = {
	login: async (event) => {
		const form = await superValidate(event, zod4(loginSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { username, password } = form.data as LoginSchema;

		const results = await db.select().from(table.user).where(eq(table.user.username, username));

		const existingUser = results.at(0);
		if (!existingUser) {
			return message(form, 'Incorrect username or password', { status: 400 });
		}

		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			return message(form, 'Incorrect username or password', { status: 400 });
		}

		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return redirect(302, '/demo/lucia');
	},
	register: async (event) => {
		const form = await superValidate(event, zod4(loginSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { username, password } = form.data as LoginSchema;

		const userId = generateUserId();
		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		try {
			await db.insert(table.user).values({ id: userId, username, passwordHash });

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch {
			return message(form, 'An error has occurred', { status: 500 });
		}
		return redirect(302, '/demo/lucia');
	}
};

function generateUserId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}
