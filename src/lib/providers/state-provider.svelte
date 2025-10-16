<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	let {
		initial,
		children
	}: {
		initial: T;
		children: Snippet<[T, (value: T) => void]>;
	} = $props();

	let state = $state<T>(initial);

	function setState(value: T) {
		state = value;
	}
</script>

{@render children(state, setState)}
