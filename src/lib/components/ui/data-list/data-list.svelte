<!-- lib/components/ui/data-list/data-list.svelte -->
<script lang="ts">
	import { setDatalistContext } from './context.svelte';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className,
		...restProps
	}: {
		children: Snippet;
		class?: string;
		[key: string]: any;
	} = $props();

	// Portal registry
	const portals = $state(new Map());
	let openPortalId = $state<string | null>(null);

	function registerPortal(id: string, snippet: Snippet, direction: 'top' | 'bottom') {
		portals.set(id, { snippet, direction, id });
	}

	function unregisterPortal(id: string) {
		portals.delete(id);
		if (openPortalId === id) {
			openPortalId = null;
		}
	}

	function setOpenPortal(id: string | null) {
		openPortalId = id;
	}

	// Set context for child components
	setDatalistContext({
		portals,
		registerPortal,
		unregisterPortal,
		get openPortalId() {
			return openPortalId;
		},
		setOpenPortal
	});

	// Get active portal
	const activePortal = $derived(openPortalId ? portals.get(openPortalId) : null);
</script>

<div
	class={cn('datalist-container relative', 'pb-[calc(env(keyboard-inset-height))]', className)}
	{...restProps}
>
	<!-- Render children (includes input and Portal definitions) -->
	{@render children()}

	<!-- Render active portal at appropriate position -->
	{#if activePortal}
		{@const direction = activePortal.direction}
		<div
			onpointerdown={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			tabindex={-1}
			role="menu"
			onkeydown={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			onclick={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			class={cn(
				'datalist-portal-container sticky right-0 left-0 z-50',
				direction === 'bottom'
					? 'bottom-[calc(env(keyboard-inset-height))]'
					: 'top-[calc(env(keyboard-inset-height))]'
			)}
			transition:slide={{
				axis: 'y',
				duration: 200
				// Slide from bottom if direction is bottom, from top if top
			}}
			style:transform-origin={direction === 'bottom' ? 'bottom' : 'top'}
		>
			{@render activePortal?.snippet()}
		</div>
	{/if}
</div>
