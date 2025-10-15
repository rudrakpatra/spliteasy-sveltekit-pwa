<!-- datalist.svelte (remade for TipTap) -->
<script lang="ts">
	import { cn } from '$lib/utils';
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { slide } from 'svelte/transition';
	import type { Editor } from '@tiptap/core';
	import { VisualViewportView } from '$lib/components/ui/visual-viewport-view';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		editor?: Editor;
		showWhen?: () => boolean;
		children: Snippet;
	}

	let { editor, showWhen, class: className, children, ...restProps }: Props = $props();

	const context = $state({
		target: null as HTMLInputElement | null,
		editor
	});

	setContext('datalist-context', context);

	let isEditorFocused = $state(false);

	$effect(() => {
		const checkFocus = () => {
			isEditorFocused = document.activeElement === editor?.view.dom;
		};

		if (editor) {
			checkFocus();
			document.addEventListener('focusin', checkFocus);
			return () => document.removeEventListener('focusin', checkFocus);
		}
	});

	let isVisible = $derived(editor && isEditorFocused && (!showWhen || showWhen()));
</script>

{#if isVisible}
	<div transition:slide={{ axis: 'y' }} class={cn('datalist-root', className)} {...restProps}>
		{@render children()}
	</div>
{/if}
