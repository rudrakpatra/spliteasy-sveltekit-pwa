import type { Router } from './router';
import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit';
import { svelteQueryWrapper } from 'trpc-svelte-query-adapter';
import type { QueryClient } from '@tanstack/svelte-query';
import superjson from 'superjson';

export type TRPCClientType = ReturnType<typeof svelteQueryWrapper<Router>>;

let browserClient: TRPCClientType | undefined;

export function trpc(
    init?: TRPCClientInit,
    queryClient?: QueryClient
): TRPCClientType {
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser && browserClient) return browserClient;

    const client = svelteQueryWrapper<Router>({
        client: createTRPCClient<Router>({
            init,
            url: '/api/trpc',
            transformer: superjson,
        }),
        queryClient,
    });

    if (isBrowser) browserClient = client;

    return client;
}
