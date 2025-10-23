<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { browser } from '$app/environment';
	import { enableVirtualKeyboardOverlayContent } from '$lib/components/ui/view/keyboard-aware-view.svelte';
	import ActiveElementProvider from '$lib/hooks/activeElement/active-element-provider.svelte';
	let { children } = $props();
	// Create query client
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				staleTime: 60 * 1000
			}
		}
	});

	enableVirtualKeyboardOverlayContent(console.log);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1 , maximum-scale=2 interactive-widget=resizes-content"
	/>
	<link rel="manifest" href="/manifest.json" />
</svelte:head>
<ModeWatcher />
<Toaster />
<QueryClientProvider client={queryClient}>
	<ActiveElementProvider>
		{@render children()}
	</ActiveElementProvider>
</QueryClientProvider>
