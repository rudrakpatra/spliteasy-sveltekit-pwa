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

export type GroupId = typeof expenses.groupId | typeof groupMembers.groupId;

export function sqlIsGroupMember(groupIdSql: GroupId, userId: UserId) {
    return sql`EXISTS (
    SELECT 1 FROM ${groupMembers}
    WHERE ${groupMembers.groupId} = ${groupIdSql}
      AND ${groupMembers.userId} = ${userId}
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
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, userId),
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
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId));

    return rows.map((r: { userId: UserId }) => r.userId);
}
