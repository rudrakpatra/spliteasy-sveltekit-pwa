<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		useVisualViewport,
		type VisualViewportData
	} from '$lib/hooks/use-visual-viewport.svelte';

	interface Props {
		children: Snippet<[VisualViewportData]>;
		class?: string;
		/**
		 * CSS transition duration
		 * @default '200ms'
		 */
		transitionDuration?: string;
		/**
		 * CSS transition timing function
		 * @default 'cubic-bezier(0.33, 1, 0.68, 1)'
		 */
		transitionTiming?: string;
	}

	let {
		children,
		class: className,
		transitionDuration = '20ms',
		transitionTiming = 'cubic-bezier(0.33, 1, 0.68, 1)',
		...restProps
	}: Props = $props();

	const viewport = useVisualViewport();

	const transformStyle = $derived(
		`translate3d(${viewport.offsetLeft}px, ${viewport.offsetTop}px, 0)`
	);
</script>

<div
	id="visual-viewport-view"
	class={className}
	style="
        position: fixed;
        top: 0;
        left: 0;
        width: {viewport.width}px;
        height: {viewport.height}px;
        transform: {transformStyle};
        transition: transform {transitionDuration} {transitionTiming};
        will-change: transform;
        z-index: 50;
    "
	{...restProps}
>
	{@render children(viewport)}
</div>

<style>
	#visual-viewport-view {
		pointer-events: none;
	}

	#visual-viewport-view :global(> *) {
		pointer-events: auto;
	}
</style>
