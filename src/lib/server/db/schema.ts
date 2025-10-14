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
import type { CurrencyCode } from '$lib/shared/currency/currency-codes';
import { userIdSchema, type UserId } from '$lib/shared/schema/user';
import { uuidSchema, type Uuid } from '$lib/shared/schema/uuid';
import { emailSchema, type Email } from '$lib/shared/schema/email';
import { numberStringSchema, type NumberString } from '$lib/shared/schema/math';
import type { Category } from '$lib/shared/category/category';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { currencyCodeSchema } from '$lib/shared/currency/currency';
import z from 'zod';

// UsersTable
export const users = pgTable('users', {
  id: varchar('id', { length: 256 }).$type<UserId>().primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  email: varchar('email', { length: 256 }).$type<Email>().notNull().unique(),
  email_verified: boolean('email_verified').notNull().default(false),
  img: text('img'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Groups
export const groups = pgTable('groups', {
  id: uuid('id').$type<Uuid>().defaultRandom().primaryKey(),
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
    groupId: uuid('group_id').$type<Uuid>()
      .notNull()
      .references(() => groups.id, { onDelete: 'restrict' }),
    userId: varchar('user_id', { length: 256 }).$type<UserId>()
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
    id: uuid('id').$type<Uuid>().defaultRandom().primaryKey(),
    groupId: uuid('group_id').$type<Uuid>()
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
      category: Category["code"] | null;
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
    expenseId: uuid('expense_id').$type<Uuid>()
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 256 }).$type<UserId>()
      .notNull()
      .references(() => users.id),
    groupId: uuid('group_id').$type<Uuid>()
      .notNull()
      .references(() => groups.id),
    currency: varchar('currency', { length: 8 }).notNull().$type<CurrencyCode>(),
    owesAmount: decimal('owes_amount').notNull().$type<NumberString>(),
    paidAmount: decimal('paid_amount').notNull().$type<NumberString>(),
    isApproved: boolean('is_approved').notNull().default(false),
    approvalTime: timestamp('approval_time', { withTimezone: true })
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.expenseId, table.userId] }),
    index('expense_splits_group_id_idx').using('hash', table.groupId),
    index('expense_splits_currency_idx').using('hash', table.currency),
    index('expense_splits_is_approved_idx').on(table.isApproved),
  ],
);

export const usersInsertSchema = createInsertSchema(users).extend({
  id: userIdSchema,
  email: emailSchema,
})
export const usersSelectSchema = createSelectSchema(users).extend({
  id: userIdSchema,
  email: emailSchema,
})
export const groupsInsertSchema = createInsertSchema(groups).extend({
  id: uuidSchema,
})
export const groupsSelectSchema = createSelectSchema(groups).extend({
  id: uuidSchema,
})

export const groupMembersInsertSchema = createInsertSchema(groupMembers).extend({
  groupId: uuidSchema,
  userId: userIdSchema,
})
export const groupMembersSelectSchema = createSelectSchema(groupMembers).extend({
  groupId: uuidSchema,
  userId: userIdSchema,
})

export const expensesInsertSchema = createInsertSchema(expenses).extend({
  id: uuidSchema,
})
export const expensesSelectSchema = createSelectSchema(expenses).extend({
  id: uuidSchema,
})

export const expenseSplitsInsertSchema = createInsertSchema(expenseSplits).extend({
  expenseId: uuidSchema,
  userId: userIdSchema,
  groupId: uuidSchema,
  currency: currencyCodeSchema,
  owesAmount: numberStringSchema,
  paidAmount: numberStringSchema,
});
export const expenseSplitsSelectSchema = createSelectSchema(expenseSplits).extend({
  expenseId: uuidSchema,
  userId: userIdSchema,
  groupId: uuidSchema,
  currency: currencyCodeSchema,
  owesAmount: numberStringSchema,
  paidAmount: numberStringSchema,
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