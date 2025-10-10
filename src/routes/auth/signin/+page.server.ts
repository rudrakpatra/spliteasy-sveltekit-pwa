import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
    // In dev mode, auto-login with first user
    if (dev) {
        const [firstUser] = await db.select().from(users).limit(1);

        if (firstUser) {
            const authUser = {
                id: firstUser.id,
                name: firstUser.name,
                email: firstUser.email,
                email_verified: firstUser.email_verified,
                image: firstUser.img || "",
                exp: Date.now() + 60 * 60 * 1000
            };
            // Create session and set cookie
            const token = auth.createUserSession(authUser);
            auth.setAuthTokenCookie(event, token);
            return { user: authUser };
        }
    }

    return {};
};
