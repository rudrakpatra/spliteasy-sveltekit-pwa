// trpc/dbUtils.ts
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { expenses, groupMembers } from "$lib/server/db/schema";
import type { Uuid } from "$lib/shared/schema/uuid";
import type { UserId } from "$lib/shared/schema/user";


export type PaginatedResult<T> = {
    items: T[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
};

export type GroupId = typeof expenses.group_id | typeof groupMembers.group_id;

export function sqlIsGroupMember(groupIdSql: GroupId, userId: UserId) {
    return sql`EXISTS (
    SELECT 1 FROM ${groupMembers}
    WHERE ${groupMembers.group_id} = ${groupIdSql}
      AND ${groupMembers.user_id} = ${userId}
  )`;
}

export async function ensureGroupMember(
    ctx: any,
    groupId: Uuid,
    userId: UserId,
) {
    const rows = await ctx
        .select()
        .from(groupMembers)
        .where(
            and(
                eq(groupMembers.group_id, groupId),
                eq(groupMembers.user_id, userId),
            ),
        )
        .limit(1);

    if (!rows.length) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a member of this group',
        });
    }

    return rows[0];
}

export async function getGroupMemberIds(
    ctx: any,
    groupId: Uuid,
): Promise<UserId[]> {
    const rows = await ctx
        .select({ userId: groupMembers.user_id })
        .from(groupMembers)
        .where(eq(groupMembers.group_id, groupId));

    return rows.map((r: { userId: UserId }) => r.userId);
}
