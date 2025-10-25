import { getContext, setContext } from 'svelte';
import type { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { Category } from '$lib/shared/category/category';
import type { UserId } from '$lib/shared/schema/user';
import type { AmountExpression } from '$lib/shared/schema/math';
import type { CurrencyCode } from '$lib/shared/currency/currency-codes';
import type { Uuid } from '$lib/shared/schema/uuid';
import type { inferProcedureOutput } from '@trpc/server';
import type { Router } from '$lib/trpc/router';

export type AnalyzeOutput = inferProcedureOutput<Router['ai']['analyze']>;
export type AnalyzeDataKey = keyof AnalyzeOutput['data'];


export type Payer = {
    amount: AmountExpression;
}

export type Item = {
    name: string;
    amount: AmountExpression;
    selected: boolean;
}

export type Split = {
    itemIds: SvelteSet<ItemId>;
    shares: SvelteMap<UserId, AmountExpression>;
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
    name: {
        readonly current: string;
        set: (name: string) => void;
    }
    currency: {
        readonly current: CurrencyCode | undefined;
        readonly digits: number;
        set: (currencyCode: CurrencyCode) => void;
    };
    groupId: {
        readonly current: Uuid;
        set: (groupId: Uuid) => void;
    };
    payers: SvelteMap<UserId, Payer>;
    items: SvelteMap<ItemId, Item>;
    splits: SvelteMap<SplitId, Split>;
    notes: {
        readonly current: string;
        set: (notes: string) => void;
    }
    categoryCode: {
        readonly current: Category["code"];
        set: (categoryCode: Category["code"]) => void;
    }
    submitting: boolean;
};

const KEY = Symbol('EXPENSE_ADD_FORM');

export function setExpenseFormContext(ctx: ExpenseFormContext) {
    return setContext(KEY, ctx);
}

export function getExpenseFormContext() {
    return getContext<ExpenseFormContext>(KEY);
}

export type ItemId = string
export type SplitId = string
export function generateItemId(): ItemId {
    return crypto.randomUUID().substring(0, 6);
}
export function generateSplitId(): SplitId {
    return crypto.randomUUID().substring(0, 6);
}