import {
  boolean,
  decimal,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import type { CurrencyCode } from '$lib/currency/currency-codes';
import type { GoogleUser } from '$lib/server/google-oauth';

// UsersTable
export const users = pgTable('users', {
  id: varchar('id', { length: 256 }).$type<GoogleUser['sub']>().primaryKey(),
  name: varchar('name', { length: 128 }).$type<GoogleUser['name']>().notNull(),
  email: varchar('email', { length: 256 }).$type<GoogleUser['email']>().notNull().unique(),
  email_verified: boolean('email_verified').$type<GoogleUser['email_verified']>().notNull().default(false),
  img: text('img').$type<GoogleUser['picture']>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Groups
export const groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  img: text('img').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// GroupMembers
export const groupMembers = pgTable(
  'group_members',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'restrict' }),
    userId: varchar('user_id', { length: 256 })
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    metaData: jsonb('meta_data').$type<{}>().notNull().default({}),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

// Expenses
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    name: varchar('name', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    updatedBy: varchar('updated_by', { length: 256 })
      .notNull()
      .references(() => users.id),
    isPayment: boolean('is_payment').notNull().default(false),
    metadata: jsonb('metadata').$type<{
      category: string | null;
      notes: string | null;
      receiptImageUrl: string | null;
    }>(),
  },
  (table) => [
    index('expenses_group_id_idx').using('hash', table.groupId),
    index('expenses_updated_at_idx').on(table.updatedAt),
  ],
);

// ExpenseSplits
export const expenseSplits = pgTable(
  'expense_splits',
  {
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 256 })
      .notNull()
      .references(() => users.id),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    currency: varchar('currency', { length: 8 }).notNull().$type<CurrencyCode>(),
    owesAmount: decimal('owes_amount').notNull().$type<DecimalString>(),
    paidAmount: decimal('paid_amount').notNull().$type<DecimalString>(),
    isApproved: boolean('is_approved').notNull().default(false),
    approvalTime: timestamp('approval_time', { withTimezone: true })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.expenseId, table.userId] }),
    index('expense_splits_group_id_idx').using('hash', table.groupId),
    index('expense_splits_currency_idx').using('hash', table.currency),
    index('expense_splits_is_approved_idx').on(table.isApproved),
  ],
);

const decimalStringSchema = z.string().regex(/^-?\d+(\.\d+)?$/, {
  message: 'Must be a string representing a number',
});
export type DecimalString = `${number}`;

// export const usersInsertSchema = createInsertSchema(users);
export const usersSelectSchema = createSelectSchema(users);
// export const groupsInsertSchema = createInsertSchema(groups);
export const groupsSelectSchema = createSelectSchema(groups);

// export const groupMembersInsertSchema = createInsertSchema(groupMembers);
export const groupMembersSelectSchema = createSelectSchema(groupMembers);

export const expensesInsertSchema = createInsertSchema(expenses);
export const expensesSelectSchema = createSelectSchema(expenses);

// export const expenseSplitsInsertSchema = createInsertSchema(expenseSplits);
export const expenseSplitsSelectSchema = createSelectSchema(expenseSplits).extend({
  owesAmount: decimalStringSchema,
  paidAmount: decimalStringSchema,
});

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectGroup = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;
export type SelectGroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;
export type SelectExpense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
export type SelectExpenseSplit = typeof expenseSplits.$inferSelect;
export type InsertExpenseSplit = typeof expenseSplits.$inferInsert;

export const expenseSchema = expensesSelectSchema
  .extend({
    splits: z.array(expenseSplitsSelectSchema),
  })
  .strict();
export type Expense = z.infer<typeof expenseSchema>;

export const groupSchema = groupsSelectSchema
  .extend({
    members: z.array(groupMembersSelectSchema),
  })
  .strict();
export type Group = z.infer<typeof groupSchema>;

export type paginatedResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

// Type aliases for auth system
export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
};
export type User = typeof users.$inferSelect;
