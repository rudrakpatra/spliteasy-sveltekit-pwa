// lib/components/ui/data-list/context.svelte.ts
import { getContext, setContext } from 'svelte';
import type { Snippet } from 'svelte';

type Direction = 'top' | 'bottom';

type DatalistPortalDef = {
    snippet: Snippet;
    direction: Direction;
    id: string;
};

type DatalistContext = {
    portals: Map<string, DatalistPortalDef>;
    registerPortal: (id: string, snippet: Snippet, direction: Direction) => void;
    unregisterPortal: (id: string) => void;
    openPortalId: string | null;
    setOpenPortal: (id: string | null) => void;
};

const DATALIST_KEY = Symbol('DATALIST_CONTEXT');

export function setDatalistContext(ctx: DatalistContext) {
    return setContext(DATALIST_KEY, ctx);
}

export function getDatalistContext() {
    return getContext<DatalistContext>(DATALIST_KEY);
}
