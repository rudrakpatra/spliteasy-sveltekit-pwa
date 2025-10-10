import { createGroupSchema } from "$lib/schemas/group";
import { groupMembers, groups } from "$lib/server/db/schema";
import { protectedProcedure, t } from "../init";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const router = t.router({
    list: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.db.select().from(groups);
        }),
    create: protectedProcedure
        .input(createGroupSchema)
        .mutation(async ({ input, ctx }) => {
            const [newGroup] = await ctx.db
                .insert(groups)
                .values({
                    name: input.name,
                    img: input.img || `https://api.dicebear.com/7.x/shapes/svg?seed=${input.name}`,
                })
                .returning();

            return newGroup;
        }),
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
            const group = await ctx.db
                .select()
                .from(groups)
                .where(eq(groups.id, input.id))
                .limit(1)
            return group[0];
        }),
    getMembers: protectedProcedure
        .input(z.object({ groupId: z.string() }))
        .query(async ({ input, ctx }) => {
            return await ctx.db
                .select()
                .from(groupMembers)
                .where(eq(groupMembers.groupId, input.groupId));
        })
});