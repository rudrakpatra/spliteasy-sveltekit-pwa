import { getContext, setContext } from 'svelte';
import type { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { AmountExpression } from '$lib/shared/schema/math';
import type { CurrencyCode } from '$lib/shared/currency/currency-codes';
import type { inferProcedureOutput } from '@trpc/server';
import type { Router } from '$lib/trpc/router';
import type { createOneTimeExpenseProposalSchema } from '$lib/shared/schema/expense';

export type AnalyzeOutput = inferProcedureOutput<Router['ai']['analyze']>;
export type AnalyzeDataKey = keyof AnalyzeOutput['data'];


export type Participant = {
    name: string,
    amount: AmountExpression;
}

export type Item = {
    name: string;
    amount: AmountExpression;
    selected: boolean;
}

export type Split = {
    itemIds: SvelteSet<Id>;
    shares: SvelteMap<Id, AmountExpression>;
}

export type ExpenseFormContext = {
    ai: {
        file: {
            readonly current: { file: File, blobUrl: string } | null;
            set: (file: File | null) => void;
        }
        prompt: {
            readonly current: string;
            set: (prompt: string) => void;
        }
        readonly isAnalyzing: boolean;
        readonly pendingFields: SvelteSet<AnalyzeDataKey>;
        analyze: () => void;
        cancel: () => void;
    }
    currency: {
        readonly current: CurrencyCode | undefined;
        readonly digits: number;
        set: (currencyCode: CurrencyCode) => void;
    };
    participants: SvelteMap<Id, Participant>;
    items: SvelteMap<Id, Item>;
    remainingAmount: AmountExpression;
    splits: SvelteMap<Id, Split>;
    parsed: ReturnType<typeof createOneTimeExpenseProposalSchema.safeParse>;
};

const KEY = Symbol('EXPENSE_ADD_FORM');

export function setExpenseFormContext(ctx: ExpenseFormContext) {
    return setContext(KEY, ctx);
}

export function getExpenseFormContext() {
    return getContext<ExpenseFormContext>(KEY);
}

export type Id = string
export function generateId(): Id {
    return crypto.randomUUID().substring(0, 6);
}