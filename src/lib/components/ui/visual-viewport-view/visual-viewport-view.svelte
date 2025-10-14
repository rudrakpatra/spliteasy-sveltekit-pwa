<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { toast } from 'svelte-sonner';

	interface Props {
		children?: Snippet;
		class?: string;
		style?: string;
		forceOverlaysContent?: boolean;
	}

	let { children, class: className, style, forceOverlaysContent }: Props = $props();

	// Handle hydration for immediatelyRender prop
	onMount(() => {
		// Enable VirtualKeyboard API to use CSS env variables
		if ('virtualKeyboard' in navigator) {
			console.log('VirtualKeyboard API supported');
			if (forceOverlaysContent) {
				(navigator.virtualKeyboard as any).overlaysContent = true;
				return;
			}
			if ((navigator.virtualKeyboard as any).overlaysContent === false) {
				toast.warning('Visual Viewport View may not work properly. Check console for more info.');
				console.warn('Please set navigator.virtualKeyboard.overlaysContent=true');
			}
		} else {
			toast.warning('VirtualKeyboard API not supported');
		}
	});
</script>

<div id="visual-viewport-view" class={className} {style}>
	{@render children?.()}
</div>

<style>
	#visual-viewport-view {
		position: fixed;
		inset: 0;
		width: 100dvw;
		height: calc(100dvh - env(keyboard-inset-height, 0px));
		z-index: 50;
		pointer-events: none;
	}

	#visual-viewport-view :global(> *) {
		pointer-events: auto;
	}
</style>
