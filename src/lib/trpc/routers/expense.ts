import { expenses } from "$lib/server/db/schema";
import { protectedProcedure, t } from "../init";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { uuidSchema } from "$lib/schemas/uuid";


export const router = t.router({
    list: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.db
                .select()
                .from(expenses)
        }),
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
            const id = uuidSchema.decode(input.id);
            const expense = await ctx.db
                .select()
                .from(expenses)
                .where(eq(expenses.id, id))
                .limit(1);
            return expense[0] || null;
        })
});