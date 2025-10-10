import { createGroupSchema } from "$lib/schemas/group";
import { db } from "$lib/server/db";
import { groups } from "$lib/server/db/schema";
import { t } from "../init";
import { TRPCError } from "@trpc/server";

export const router = t.router({
    list: t.procedure.query(async () => {
        return await db.select().from(groups);
    }),
    create: t.procedure
        .input(createGroupSchema)
        .mutation(async ({ input, ctx }) => {
            if (!ctx.event.locals.user) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You must be logged in to create a group',
                });
            }

            const [newGroup] = await db
                .insert(groups)
                .values({
                    name: input.name,
                    img: input.img || `https://api.dicebear.com/7.x/shapes/svg?seed=${input.name}`,
                })
                .returning();

            return newGroup;
        }),
}); 