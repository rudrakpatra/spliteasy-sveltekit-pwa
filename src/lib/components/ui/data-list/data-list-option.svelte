<!-- lib/components/ui/data-list/data-list-option.svelte -->
<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = Omit<HTMLButtonAttributes, 'onclick' | 'onpointerdown'> & {
		children?: Snippet;
		value: string;
		commandType?: 'insert' | 'replace';
		class?: string;
	};

	let { children, value, commandType = 'insert', class: className, ...restProps }: Props = $props();

	function handlePointerDown(e: PointerEvent) {
		// Prevent blur on the input when clicking option
		e.preventDefault();
	}

	function handleClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		// Get the currently focused input element
		const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;

		if (
			activeElement &&
			(activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
		) {
			const start = activeElement.selectionStart ?? 0;
			const end = activeElement.selectionEnd ?? 0;
			const currentValue = activeElement.value;

			if (commandType === 'insert') {
				// Insert text at cursor position
				const newValue = currentValue.slice(0, start) + value + currentValue.slice(end);

				// Update value
				activeElement.value = newValue;

				// Dispatch input event to trigger reactivity (Svelte bindings)
				activeElement.dispatchEvent(new Event('input', { bubbles: true }));

				// Set cursor position after inserted text
				const newCursorPos = start + value.length;
				activeElement.setSelectionRange(newCursorPos, newCursorPos);
			} else if (commandType === 'replace') {
				// Replace entire value
				activeElement.value = value;

				// Dispatch input event
				activeElement.dispatchEvent(new Event('input', { bubbles: true }));

				// Set cursor at end
				activeElement.setSelectionRange(value.length, value.length);
			}

			// Keep focus on input
			activeElement.focus();
		}
	}
</script>

<button
	type="button"
	class={cn(
		'datalist-option w-full px-4 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
		className
	)}
	onpointerdown={handlePointerDown}
	onclick={handleClick}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		{value}
	{/if}
</button>
