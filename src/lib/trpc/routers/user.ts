// trpc/routers/user.ts
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, t } from "../init";
import { users, expenseSplits, expenses, expensesSelectSchema } from "$lib/server/db/schema";
import { userIdSchema } from "$lib/shared/schema/user";
import type { CurrencyCode } from "$lib/shared/currency/currency-codes";
import type { NumberString } from "$lib/shared/schema/math";
import { emailSchema } from "$lib/shared/schema/email";

export const userRouter = t.router({
    // Get user by ID
    getById: protectedProcedure
        .input(z.object({ id: userIdSchema }))
        .query(async ({ input, ctx }) => {
            const user = await ctx.db
                .select()
                .from(users)
                .where(eq(users.id, input.id))
                .limit(1);

            if (!user[0]) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User not found',
                });
            }

            return user[0];
        }),

    // Get user by email
    getByEmail: protectedProcedure
        .input(z.object({ email: emailSchema }))
        .query(async ({ input, ctx }) => {
            const rows = await ctx.db
                .select()
                .from(users)
                .where(eq(users.email, input.email))
                .limit(1);

            if (!rows.length) {
                return null;
            }

            return rows[0];
        }),

    // Get current user's balance across all groups
    getBalance: protectedProcedure
        .query(async ({ ctx }) => {
            const rows = await ctx.db
                .select({
                    groupId: expenseSplits.groupId,
                    currency: expenseSplits.currency,
                    balance: sql<NumberString>`SUM((${expenseSplits}.paid_amount::numeric - ${expenseSplits}.owes_amount::numeric))::text`,
                })
                .from(expenseSplits)
                .where(
                    and(
                        eq(expenseSplits.userId, ctx.user.id),
                        eq(expenseSplits.isApproved, true),
                        sql`NOT EXISTS (
              SELECT 1 FROM expense_splits es2
              WHERE es2.expense_id = ${expenseSplits}.expense_id 
              AND es2.is_approved = false
            )`,
                    ),
                )
                .groupBy(expenseSplits.groupId, expenseSplits.currency);

            const result: Record<string, Record<CurrencyCode, NumberString>> = {};
            for (const row of rows) {
                if (!result[row.groupId]) {
                    result[row.groupId] = {} as Record<CurrencyCode, NumberString>;
                }
                result[row.groupId][row.currency] = row.balance;
            }

            return result;
        }),

    // Get expenses pending user's approval
    getPendingApprovals: protectedProcedure
        .input(z.object({
            limit: z.number().default(20),
            offset: z.number().default(0),
        }))
        .query(async ({ input, ctx }) => {
            const rows = await ctx.db
                .select({
                    expense: expenses,
                    splitsJson: sql<any>`
            COALESCE(
              json_agg(${expenseSplits}.*) FILTER (WHERE ${expenseSplits}.expense_id IS NOT NULL),
              '[]'::json
            )
          `,
                    total: sql<number>`count(*) OVER ()`,
                })
                .from(expenses)
                .leftJoin(expenseSplits, eq(expenseSplits.expenseId, expenses.id))
                .where(
                    sql`EXISTS (
            SELECT 1 FROM expense_splits es
            WHERE es.expense_id = ${expenses}.id
              AND es.user_id = ${ctx.user.id}
              AND es.is_approved = false
          )`,
                )
                .groupBy(expenses.id)
                .orderBy(desc(expenses.updatedAt))
                .limit(input.limit)
                .offset(input.offset);

            const items = rows.map((r) =>
                expensesSelectSchema.parse({
                    ...r.expense,
                    splits: (r.splitsJson as unknown[]) ?? [],
                }),
            );

            const total = rows[0]?.total ?? 0;

            return {
                items,
                total,
                limit: input.limit,
                offset: input.offset,
                hasMore: input.offset + items.length < total,
            };
        }),
});
