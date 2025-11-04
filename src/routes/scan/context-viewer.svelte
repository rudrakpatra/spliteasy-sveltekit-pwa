<script lang="ts">
	import { getExpenseFormContext } from './context.svelte';

	const ctx = getExpenseFormContext();
</script>

<!-- Debug JSON -->
<pre>
ctx:
{JSON.stringify(ctx, null, 2)}
____
payers: {JSON.stringify(Array.from(ctx.participants.entries()), null, 2)}
____
items: {JSON.stringify(Array.from(ctx.items.entries()), null, 2)}
____
splits: {JSON.stringify(Array.from(ctx.splits.entries()), null, 2)}
____
aiPendingFields:
{JSON.stringify(ctx.ai.pendingFields, null, 2)}
</pre>

<style>
	pre {
		font-size: 10px;
		white-space: pre-wrap;
		width: 100%;
		overflow-x: auto;
	}
</style>
