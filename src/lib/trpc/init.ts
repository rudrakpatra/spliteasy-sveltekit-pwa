import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";
import { TRPCError } from "@trpc/server";

export const t = initTRPC.context<Context>().create({
    transformer: superjson,
});

// Middleware to check authentication
const isAuthenticated = t.middleware(({ ctx, next }) => {
    if (!ctx.event.locals.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to access this resource',
        });
    }

    // Return a context with non-null user type
    return next({
        ctx: {
            ...ctx,
            user: ctx.event.locals.user,
        },
    });
});

export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(isAuthenticated);