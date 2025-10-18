import { getContext, setContext } from 'svelte';
import type { SuperForm } from 'sveltekit-superforms';
import type { createExpenseSchema } from '$lib/shared/schema/expense';
import type { inferRouterOutputs } from '@trpc/server';
import type { Router } from '$lib/trpc/router';
import type z from 'zod';
import type { CreateQueryResult } from '@tanstack/svelte-query';
import type { TRPCClientErrorLike } from '@trpc/client';

// Infer output types from your router
type RouterOutputs = inferRouterOutputs<Router>;

// Extract specific output types
type GroupMembersOutput = RouterOutputs['group']['getMembers'];
type GroupListOutput = RouterOutputs['group']['list'];

// Extract individual types
type Member = GroupMembersOutput[number];
type Group = GroupListOutput["items"][number];

// Define the query result store types with proper TanStack Query types
type MembersQueryResult = CreateQueryResult<GroupMembersOutput, TRPCClientErrorLike<Router>>;
type GroupsQueryResult = CreateQueryResult<GroupListOutput, TRPCClientErrorLike<Router>>;

type ExpenseFormContext = {
    form: SuperForm<z.infer<typeof createExpenseSchema>>;
    membersQuery: MembersQueryResult;
    groupsQuery: GroupsQueryResult;
    receipt: { url: string | null; file: File | null };
};

const KEY = Symbol('EXPENSE_FORM');

export function setExpenseFormContext(ctx: ExpenseFormContext) {
    return setContext(KEY, ctx);
}

export function getExpenseFormContext() {
    return getContext<ExpenseFormContext>(KEY);
}

// Export helper types for use in components
export type { Member, Group, GroupMembersOutput, GroupListOutput };
