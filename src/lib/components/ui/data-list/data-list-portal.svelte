<!-- lib/components/ui/data-list/datalist-portal.svelte -->
<script lang="ts">
	import { getDatalistContext } from './context.svelte';
	import { onMount, onDestroy, untrack } from 'svelte';
	import type { Snippet } from 'svelte';

	let {
		children,
		id,
		direction = 'bottom',
		open = $bindable(false),
		class: className,
		...restProps
	}: {
		children: Snippet;
		id: string;
		direction?: 'top' | 'bottom';
		open?: boolean;
		class?: string;
		[key: string]: any;
	} = $props();

	const ctx = getDatalistContext();

	// Register this portal on mount
	onMount(() => {
		ctx.registerPortal(id, children, direction);
	});

	// Unregister on destroy
	onDestroy(() => {
		ctx.unregisterPortal(id);
	});

	// ONE-WAY: local `open` prop controls context
	// When local `open` changes, update the global context
	$effect(() => {
		if (open) {
			// Opening this portal closes all others automatically
			ctx.setOpenPortal(id);
		} else {
			// Only close if THIS portal is currently open
			if (untrack(() => ctx.openPortalId) === id) {
				ctx.setOpenPortal(null);
			}
		}
	});

	// ONE-WAY: context controls local `open` prop
	// When context changes, sync local state
	$effect(() => {
		const isThisPortalOpen = ctx.openPortalId === id;

		// Use untrack to read current value without subscribing
		// This prevents circular updates
		if (isThisPortalOpen !== untrack(() => open)) {
			open = isThisPortalOpen;
		}
	});
</script>
