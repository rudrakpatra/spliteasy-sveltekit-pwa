<!-- DataListOption.svelte (updated for TipTap) -->
<script lang="ts">
	import { VIBRATE_DURATION } from '$lib/constants';
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Editor } from '@tiptap/core';

	interface Props {
		value?: string;
		label?: string;
		onSelect?: (ev: { target: HTMLElement; preventDefault: () => void; editor: Editor }) => void;
		children?: Snippet;
	}

	let { value, label, onSelect, children }: Props = $props();

	const context = getContext<{ editor?: Editor }>('datalist-context');

	function handleClick(e: Event) {
		e.preventDefault();
		const ed = context.editor;
		if (!ed) return;
		ed.chain().focus().run(); // Ensure focus
		let defaultPrevented = false;
		const ev = {
			target: e.currentTarget as HTMLElement,
			preventDefault: () => {
				defaultPrevented = true;
			},
			editor: ed
		};
		onSelect && onSelect(ev);
		if (defaultPrevented) return;
		if (value) {
			navigator.vibrate?.(VIBRATE_DURATION);
			ed.chain().focus().insertContent(value).run();
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
