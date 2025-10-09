import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { groups } from '$lib/server/db/schema'

export const GET: RequestHandler = async (event) => {
    const user = requireAuth(event);
    return json(await db.select().from(groups));
};