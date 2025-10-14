<!-- DataListOption.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import type { Snippet } from 'svelte';
	import { VIBRATE_DURATION } from '$lib/constants';

	interface Props {
		value?: string;
		label?: string;
		onSelect?: (ctx: {
			inputElement: HTMLInputElement | HTMLTextAreaElement;
			preventDefault: () => void;
		}) => void;
		children?: Snippet;
	}

	let { value, label, onSelect, children }: Props = $props();

	const context = getContext<{ inputElement: HTMLInputElement | null }>('datalist-context');

	function handleClick(e: Event) {
		e.preventDefault();
		const input = context.inputElement || document.activeElement;
		// type is input or text
		if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;

		if (input !== document.activeElement) input.focus();
		let defaultPrevented = false;
		if (onSelect)
			onSelect({ inputElement: input, preventDefault: () => (defaultPrevented = true) });
		if (defaultPrevented) return;

		if (value) {
			try {
				navigator.vibrate(VIBRATE_DURATION);
				document.execCommand('insertText', false, value);
			} catch (error) {
				// Fallback for browsers that don't support execCommand
				const currentValue = input.value;
				const start = input.selectionStart ?? 0;
				const end = input.selectionEnd ?? currentValue.length;
				const newValue = currentValue.slice(0, start) + value + currentValue.slice(end);
				input.value = newValue;
				const newCursorPos = start + value.length;
				input.setSelectionRange(newCursorPos, newCursorPos);
				input.dispatchEvent(new Event('input', { bubbles: true }));
			}
		}
	}

	function handlePointerdown(e: Event) {
		e.preventDefault();
		e.stopPropagation();
	}
</script>

<button onpointerdown={handlePointerdown} onclick={handleClick}>
	{#if children}
		{@render children()}
	{:else}
		{label ?? value}
	{/if}
</button>
