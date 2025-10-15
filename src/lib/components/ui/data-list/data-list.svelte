<script lang="ts">
	import { cn } from '$lib/utils';
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { slide } from 'svelte/transition';
	import { useActiveElement } from '$lib/hooks/use-active-element.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		for?: string;
		children: Snippet;
	}

	let { for: inputId, class: className, children, ...restProps }: Props = $props();

	const context = $state({
		target: null as HTMLInputElement | null
	});

	let isInputFocused = $state(false);

	setContext('datalist-context', context);

	// Use the active element hook
	const activeElement = useActiveElement();

	$effect(() => {
		if (typeof document !== 'undefined') {
			if (inputId) {
				const input = document.getElementById(inputId) as HTMLInputElement | null;
				context.target = input;
			}
		}
	});

	$effect(() => {
		const activeEl = activeElement.current;

		if (inputId) {
			// Check if the specific input is focused
			isInputFocused = activeEl?.id === inputId;
		} else if (context.target) {
			// Check if the context input is focused
			isInputFocused = activeEl === context.target;
		} else {
			// Check if any input or textarea or contenteditable is focused
			isInputFocused =
				activeEl?.tagName === 'INPUT' ||
				activeEl?.tagName === 'TEXTAREA' ||
				activeEl?.getAttribute('contenteditable') === 'true';
		}
	});

	$effect(() => {
		if (isInputFocused) {
			document.documentElement.style.setProperty('--datalist-open', '1');
		} else {
			document.documentElement.style.removeProperty('--datalist-open');
		}
	});
</script>

{#if isInputFocused}
	<div transition:slide={{ axis: 'y' }} class={cn('datalist-root', className)} {...restProps}>
		{@render children()}
	</div>
{/if}
