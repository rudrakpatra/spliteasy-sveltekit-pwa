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

// UsersTable
export const users = pgTable('users', {
  id: varchar('id', { length: 256 }).$type<UserId>().primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  email: varchar('email', { length: 256 }).$type<Email>().notNull().unique(),
  email_verified: boolean('email_verified').notNull().default(false),
  img: text('img'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Groups
export const groups = pgTable('groups', {
  id: uuid('id').$type<Uuid>().defaultRandom().primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  img: text('img').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// GroupMembers
export const groupMembers = pgTable(
  'group_members',
  {
    group_id: uuid('group_id').$type<Uuid>()
      .notNull()
      .references(() => groups.id, { onDelete: 'restrict' }),
    user_id: varchar('user_id', { length: 256 }).$type<UserId>()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    joined_at: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    meta_data: jsonb('meta_data').$type<{}>().notNull().default({}),
  },
  (table) => [primaryKey({ columns: [table.group_id, table.user_id] })],
);

// Expenses
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').$type<Uuid>().defaultRandom().primaryKey(),
    group_id: uuid('group_id').$type<Uuid>()
      .notNull()
      .references(() => groups.id),
    name: varchar('name', { length: 128 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    updated_by: varchar('updated_by', { length: 256 })
      .notNull()
      .references(() => users.id),
    is_payment: boolean('is_payment').notNull().default(false),
    metadata: jsonb('metadata').$type<{
      category: Category["code"] | null;
      notes: string | null;
      receiptImageUrl: string | null;
    }>(),
  },
  (table) => [
    index('expenses_group_id_idx').using('hash', table.group_id),
    index('expenses_updated_at_idx').on(table.updated_at),
  ],
);

// ExpenseSplits
export const expenseSplits = pgTable(
  'expense_splits',
  {
    expense_id: uuid('expense_id').$type<Uuid>()
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    user_id: varchar('user_id', { length: 256 }).$type<UserId>()
      .notNull()
      .references(() => users.id),
    group_id: uuid('group_id').$type<Uuid>()
      .notNull()
      .references(() => groups.id),
    currency: varchar('currency', { length: 8 }).notNull().$type<CurrencyCode>(),
    owes_amount: decimal('owes_amount').notNull().$type<NumberString>(),
    paid_amount: decimal('paid_amount').notNull().$type<NumberString>(),
    is_approved: boolean('is_approved').notNull().default(false),
    approval_time: timestamp('approval_time', { withTimezone: true })
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.expense_id, table.user_id] }),
    index('expense_splits_group_id_idx').using('hash', table.group_id),
    index('expense_splits_currency_idx').using('hash', table.currency),
    index('expense_splits_is_approved_idx').on(table.is_approved),
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
  group_id: uuidSchema,
  user_id: userIdSchema,
})
export const groupMembersSelectSchema = createSelectSchema(groupMembers).extend({
  group_id: uuidSchema,
  user_id: userIdSchema,
})

export const expensesInsertSchema = createInsertSchema(expenses).extend({
  id: uuidSchema,
})
export const expensesSelectSchema = createSelectSchema(expenses).extend({
  id: uuidSchema,
})

export const expenseSplitsInsertSchema = createInsertSchema(expenseSplits).extend({
  expense_id: uuidSchema,
  user_id: userIdSchema,
  group_id: uuidSchema,
  currency: currencyCodeSchema,
  owes_amount: numberStringSchema,
  paid_amount: numberStringSchema,
});
export const expenseSplitsSelectSchema = createSelectSchema(expenseSplits).extend({
  expense_id: uuidSchema,
  user_id: userIdSchema,
  group_id: uuidSchema,
  currency: currencyCodeSchema,
  owes_amount: numberStringSchema,
  paid_amount: numberStringSchema,
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