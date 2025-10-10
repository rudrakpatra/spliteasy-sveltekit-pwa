<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';

	let { expenseId }: { expenseId: string } = $props();

	const api = trpc(page);
	let expense = api.expense.getById.createQuery({ id: expenseId });
</script>

<div class="hover:bg-muted flex items-center gap-3 rounded-lg p-2">
	{#if $expense.isLoading}
		Loading...
	{:else if $expense.data}
		<div class="flex-1">
			<p class="font-medium">{$expense.data?.name}</p>
			<p class="text-muted-foreground text-sm">
				{$expense.data?.isPayment ? 'Payment' : 'Expense'}
			</p>
			<p class="text-muted-foreground text-sm">{$expense.data.metadata?.notes}</p>
			<p class="text-muted-foreground text-sm">{$expense.data.metadata?.receiptImageUrl}</p>
			<p class="text-muted-foreground text-sm">{$expense.data.metadata?.category}</p>
		</div>
	{:else if $expense.error}
		<p class="text-muted-foreground">Error loading expense</p>
	{/if}
</div>
