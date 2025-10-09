// src/routes/(protected)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { AuthUser } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ locals, request }) => {
    if (!locals.user) {
        throw redirect(302, '/auth/signin?redirect_to=' + encodeURIComponent(request.url));
    }

    // TypeScript now knows user is defined
    const user: AuthUser = locals.user;
    return {
        user,
    };
};