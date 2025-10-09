// src/routes/(protected)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, '/auth/signin?redirect_to=' + encodeURIComponent(request.url));
    return { user: locals.user }
};