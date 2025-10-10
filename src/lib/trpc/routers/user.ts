import { users } from "$lib/server/db/schema";
import { protectedProcedure, t } from "../init";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { userIdSchema } from "$lib/schemas/user";


export const router = t.router({
    getById: protectedProcedure
        .input(z.object({ id: userIdSchema }))
        .query(async ({ input, ctx }) => {
            const user = await ctx.db
                .select()
                .from(users)
                .where(eq(users.id, input.id))
                .limit(1);
            return user[0] || null;
        })
});