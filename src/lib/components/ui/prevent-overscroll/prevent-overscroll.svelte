<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let scrollContainerRef = $state<HTMLDivElement | null>(null);

	// The ultimate scroll prevention that prevents visual viewport from scrolling
	$effect(() => {
		const scrollContainer = scrollContainerRef;
		if (!scrollContainer) return;

		// Revert to position after scroll ends to prevent overscroll
		const handleScrollEnd = () => {
			scrollContainer.scrollTo({
				left: 0.5,
				top: 0.5,
				behavior: 'instant' as ScrollBehavior
			});
		};

		// Overscroll contain to prevent overscroll
		scrollContainer.style.overscrollBehavior = 'contain';
		scrollContainer.addEventListener('scrollend', handleScrollEnd);

		// Set initial scroll position
		handleScrollEnd();

		return () => {
			scrollContainer.style.overscrollBehavior = 'auto';
			scrollContainer.removeEventListener('scrollend', handleScrollEnd);
		};
	});
</script>

<!-- Outer container - slightly smaller -->
<div
	bind:this={scrollContainerRef}
	class="h-full w-full overflow-auto [&::-webkit-scrollbar]:hidden"
	style="width: 100%; height: 100%; scrollbar-width: none; -ms-overflow-style: none;"
>
	<!-- Inner container - slightly bigger to create scrollable area -->
	<div class="relative" style="width: calc(100% + 1px); height: calc(100% + 1px);">
		{@render children()}
	</div>
</div>
