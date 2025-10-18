<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { slide } from 'svelte/transition';
	interface Props extends HTMLAttributes<HTMLDivElement> {
		open: boolean;
		children: Snippet;
	}

	let { open = $bindable(), class: className, children, ...restProps }: Props = $props();

	$effect(() => {
		document.documentElement.style.setProperty('--datalist-height', open ? '14' : '0');
	});
</script>

{#if open}
	<div transition:slide={{ axis: 'y' }} class={cn('datalist-root', className)} {...restProps}>
		{@render children()}
	</div>
{/if}
