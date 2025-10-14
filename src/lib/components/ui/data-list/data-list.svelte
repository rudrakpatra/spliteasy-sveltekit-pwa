<!-- DataListRoot.svelte -->
<script lang="ts">
	import { cn } from '$lib/utils';
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { fly, slide } from 'svelte/transition';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		inputId?: string;
		children: Snippet;
	}

	let { inputId, class: className, children, ...restProps }: Props = $props();

	const context = $state({
		inputElement: null as HTMLInputElement | null
	});

	let isInputFocused = $state(false);

	setContext('datalist-context', context);

	$effect(() => {
		if (typeof document !== 'undefined') {
			if (inputId) {
				const input = document.getElementById(inputId) as HTMLInputElement | null;
				context.inputElement = input;
			}
		}
	});

	$effect(() => {
		if (typeof document === 'undefined') return;

		const checkActiveElement = () => {
			const activeEl = document.activeElement;

			if (inputId) {
				// Check if the specific input is focused
				isInputFocused = activeEl?.id === inputId;
			} else if (context.inputElement) {
				// Check if the context input is focused
				isInputFocused = activeEl === context.inputElement;
			} else {
				// Check if any input is focused
				isInputFocused = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
			}
		};

		checkActiveElement();

		// Listen for focus/blur events on the document
		document.addEventListener('focusin', checkActiveElement);
		document.addEventListener('focusout', checkActiveElement);

		return () => {
			document.removeEventListener('focusin', checkActiveElement);
			document.removeEventListener('focusout', checkActiveElement);
		};
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
