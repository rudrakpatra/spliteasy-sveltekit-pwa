<script lang="ts">
	import * as DataList from '$lib/components/ui/data-list';
	import { insertStyledNode, setCaretToEnd } from '../utils/selection';
	import { VIBRATE_DURATION } from '$lib/constants';
	import type { Snippet } from 'svelte';

	interface Props {
		value?: string;
		styledValue?: { html: string; text: string };
		label?: string;
		children?: Snippet;
	}

	let { value, styledValue, label, children }: Props = $props();

	function handleSelect({
		inputElement,
		preventDefault
	}: {
		inputElement: HTMLInputElement | HTMLTextAreaElement | HTMLElement;
		preventDefault: () => void;
	}) {
		// Check if input is contenteditable div
		const isContentEditable = inputElement instanceof HTMLElement && inputElement.isContentEditable;

		if (styledValue && isContentEditable) {
			preventDefault();

			try {
				navigator.vibrate?.(VIBRATE_DURATION);

				// Focus first to ensure selection is in the element
				if (document.activeElement !== inputElement) {
					inputElement.focus();
					// Move cursor to end
					setCaretToEnd(inputElement);
				}

				// Small delay to ensure focus is set
				setTimeout(() => {
					insertStyledNode(styledValue.html, styledValue.text);
					inputElement.dispatchEvent(new Event('input', { bubbles: true }));
				}, 0);
			} catch (error) {
				console.error('Failed to insert styled content:', error);
				// Fallback: insert plain text
				if (value) {
					inputElement.textContent = (inputElement.textContent || '') + value;
					setCaretToEnd(inputElement);
					inputElement.dispatchEvent(new Event('input', { bubbles: true }));
				}
			}
		}
		// For plain text inputs (textarea/input), let DataList.Option handle it normally
	}
</script>

<DataList.Option value={styledValue ? undefined : value} {label} onSelect={handleSelect}>
	{#if children}
		{@render children()}
	{:else}
		{label ?? value}
	{/if}
</DataList.Option>
