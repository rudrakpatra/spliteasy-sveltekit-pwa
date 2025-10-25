<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils';

	const ctx = getExpenseFormContext();
</script>

<div class="space-y-2">
	<Label>Notes</Label>
	<div class={cn(ctx.ai.pendingFields.has('notes') && 'ai-pending')}>
		<Textarea
			value={ctx.notes.current}
			oninput={(e) => ctx.notes.set(e.currentTarget.value)}
			placeholder="Add any additional notes..."
			data-scroll-into-view="true"
		/>
	</div>
</div>
<p class="text-xs text-muted-foreground">Notes for this expense</p>
