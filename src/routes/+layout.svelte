<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';

	// Access data from the props
	let { children, data } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000 // 1 minute
			}
		}
	});

	// Hydrate session data into query cache
	onMount(() => {
		queryClient.setQueryData(['session'], data.session);
		queryClient.setQueryData(['user'], data.user);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />

<QueryClientProvider client={queryClient}>
	{@render children?.()}
</QueryClientProvider>
