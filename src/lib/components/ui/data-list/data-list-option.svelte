<!-- DataListOption.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		label?: string;
		onDown?: (e: Event) => void;
		onSelect?: (e: Event) => void;
		children?: Snippet;
	}

	let { label, onDown, onSelect, children, ...restProps }: Props = $props();

	function handleClick(e: Event) {
		e.preventDefault();
		onSelect && onSelect(e);
	}

	function handleContextMenu(e: Event) {
		e.preventDefault();
		onSelect && onSelect(e);
	}

	function handlePointerdown(e: Event) {
		onDown && onDown(e);
		e.preventDefault();
		e.stopPropagation();
	}
</script>

<button
	tabindex={-1}
	onpointerdown={handlePointerdown}
	onclick={handleClick}
	oncontextmenu={handleContextMenu}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		{label}
	{/if}
</button>
