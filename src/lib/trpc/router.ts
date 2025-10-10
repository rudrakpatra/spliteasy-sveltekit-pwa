import { createContext, type Context } from '$lib/trpc/context';
import type { RequestEvent } from '@sveltejs/kit';
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { db } from '$lib/server/db';
import { groups } from '$lib/server/db/schema';

const t = initTRPC.context<Context>().create({
    transformer: superjson,
});

export const router = t.router({
    groups: t.router({
        list: t.procedure.query(async () => {
            return await db.select().from(groups);
        }),
    }),
});

export type Router = typeof router;

// Server-side caller for directly calling tRPC procedures
const factory = t.createCallerFactory(router);
export const createCaller = async (event: RequestEvent) => {
    return factory(await createContext(event));
};


