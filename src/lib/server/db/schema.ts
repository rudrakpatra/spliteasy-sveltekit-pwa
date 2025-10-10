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
import type { CurrencyCode } from '$lib/currency/currency-codes';
import type { UserId } from '$lib/schemas/user';
import type { Uuid } from '$lib/schemas/uuid';
import type { Email } from '$lib/schemas/email';
import type { DecimalString } from '$lib/schemas/math';

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