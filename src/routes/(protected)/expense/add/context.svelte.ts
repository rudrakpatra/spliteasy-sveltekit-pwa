import { getContext, setContext } from 'svelte';
import type { SuperForm } from 'sveltekit-superforms';
import type { createExpenseSchema } from '$lib/shared/schema/expense';
import type z from 'zod';
import type { SvelteSet } from 'svelte/reactivity';

type ExpenseFormContext = {
    form: SuperForm<z.infer<typeof createExpenseSchema>>;
    group: {
        readonly current: string;
        onChange: (groupId: string) => void;
    };
    currency: {
        readonly current: string;
        readonly digits: number;
    };
    receipt: {
        readonly blobUrl: string | undefined;
        readonly file: File | null;
        readonly isUploading: boolean;
        onChange: (event: Event) => void;
        onRemove: () => void;
    };
    payers: {
        total: number;
    }
    items: {
        total: number
        selected: SvelteSet<string>;
    };
    splits: {
        selected: SvelteSet<string>;
    };
    submitting: boolean;
};

const KEY = Symbol('EXPENSE_ADD_FORM');

export function setExpenseFormContext(ctx: ExpenseFormContext) {
    return setContext(KEY, ctx);
}

export function getExpenseFormContext() {
    return getContext<ExpenseFormContext>(KEY);
}

export function generateId() {
    return crypto.randomUUID().substring(0, 6);
}
