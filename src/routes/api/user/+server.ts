import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    const user = requireAuth(event);

    return json({
        status: 'ok',
        user,
    });
};