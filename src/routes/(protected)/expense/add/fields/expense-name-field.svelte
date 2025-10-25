<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	const ctx = getExpenseFormContext();
</script>

<div class="space-y-2">
	<Label>Expense Name</Label>
	<div class={cn(ctx.ai.pendingFields.has('name') && 'ai-pending')}>
		<Input
			placeholder="Expense Name"
			autocomplete="off"
			data-scroll-into-view="true"
			value={ctx.name.current}
			oninput={(e) => ctx.name.set(e.currentTarget.value)}
			class="w-full"
		/>
	</div>
	<p class="text-xs text-muted-foreground">Choose a name for your expense</p>
</div>
