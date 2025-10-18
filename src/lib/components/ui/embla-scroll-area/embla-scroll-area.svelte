<script lang="ts">
	import type { Snippet } from 'svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import type { EmblaOptionsType } from 'embla-carousel';

	interface Props {
		children: Snippet;
		options?: EmblaOptionsType;
		class?: string;
		containerClass?: string;
	}

	let { children, options = {}, class: className, containerClass }: Props = $props();

	const defaultOptions: EmblaOptionsType = {
		dragFree: true,
		containScroll: 'trimSnaps',
		align: 'start',
		...options
	};

	// Determine axis from merged options
	const axis = defaultOptions.axis || 'x';
</script>

<div
	class="embla {className || ''}"
	use:emblaCarouselSvelte={{ options: defaultOptions, plugins: [] }}
>
	<div
		class="embla__container {containerClass || ''}"
		class:x={axis === 'x'}
		class:y={axis === 'y'}
	>
		{@render children()}
	</div>
</div>

<style>
	.embla {
		overflow: hidden;
	}

	.embla__container {
		display: flex;
		backface-visibility: hidden;
	}

	.embla__container.x {
		flex-direction: row;
		touch-action: pan-y pinch-zoom;
	}

	.embla__container.y {
		flex-direction: column;
		height: 100%;
		touch-action: pan-x pinch-zoom;
	}
	/* Allow input interaction */
	.embla__container :global(input),
	.embla__container :global(textarea),
	.embla__container :global(select) {
		touch-action: auto;
	}
</style>
