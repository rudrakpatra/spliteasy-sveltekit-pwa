<!-- ActiveElementProvider.svelte -->
<script lang="ts">
	import { useActiveElement } from './active-element-context.svelte';

	// Initialize the context once at the root
	useActiveElement();

	const { children } = $props();
</script>

{@render children()}
