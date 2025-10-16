<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { VIBRATE_DURATION } from '$lib/constants';

	export type SuggestionProps = {
		label: string;
		cmd: () => void;
	};

	let { label, cmd }: SuggestionProps = $props();

	function handleClick(e: Event) {
		e.preventDefault();
		cmd();
		navigator.vibrate(VIBRATE_DURATION);
	}
	function handlePointerdown(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		// to stop the actual activeElement to loose focus
	}
</script>

<button onpointerdown={handlePointerdown} onclick={handleClick}>
	<Badge variant="outline" class="rounded-full p-2 px-3">{label}</Badge>
</button>
