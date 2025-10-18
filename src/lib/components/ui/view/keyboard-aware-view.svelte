<script lang="ts" module>
	export let enableVirtualKeyboardOverlayContent = (feedback: (message: string) => void) => {
		if ('virtualKeyboard' in navigator) {
			feedback('VirtualKeyboard API supported');
			(navigator.virtualKeyboard as any).overlaysContent = true;
			feedback('navigator.virtualKeyboard.overlaysContent=true');
			return true;
		}
		feedback('VirtualKeyboard API not supported');
		return false;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { toast } from 'svelte-sonner';

	interface Props {
		children?: Snippet;
		class?: string;
		style?: string;
		show?: boolean;
	}

	let { children, class: className, style, show = true }: Props = $props();

	onMount(() => {
		// Enable VirtualKeyboard API to use CSS env variables
		if ('virtualKeyboard' in navigator) {
			console.log('VirtualKeyboard API supported');
			if ((navigator.virtualKeyboard as any).overlaysContent === false) {
				toast.warning('Keyboard Aware View may not work properly. Check console for more info.');
				console.warn('Please set navigator.virtualKeyboard.overlaysContent=true');
			}
		} else {
			toast.warning('VirtualKeyboard API not supported');
		}
	});
</script>

<div id="keyboard-aware-view" class={className} {style} class:hidden={show === false}>
	{@render children?.()}
</div>

<style>
	#keyboard-aware-view {
		position: fixed;
		inset: 0;
		width: 100svw;
		height: calc(100svh - env(keyboard-inset-height, 0px));
		z-index: 50;
		pointer-events: none;
	}

	#keyboard-aware-view :global(> *) {
		pointer-events: auto;
	}
</style>
