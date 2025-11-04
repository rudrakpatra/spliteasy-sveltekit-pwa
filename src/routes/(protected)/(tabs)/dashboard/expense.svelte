<script lang="ts">
	import * as Item from '$lib/components/ui/item';
	import * as Avatar from '$lib/components/ui/avatar';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { Spinner } from '$lib/components/ui/spinner';
	import ExclaimationCircle from '@tabler/icons-svelte/icons/exclamation-circle';

	let { expenseId }: { expenseId: string } = $props();

	const api = trpc(page);
	let expense = api.expense.getById.createQuery({ id: expenseId });
</script>

{#if $expense.isLoading}
	<Item.Root>
		<Item.Media>
			<Spinner class="size-9" />
		</Item.Media>
		<Item.Content>Loading...</Item.Content>
	</Item.Root>
{:else if $expense.data}
	<Item.Root>
		<Item.Content>
			<p class="font-medium">{$expense.data?.name}</p>
			<p class="text-sm text-muted-foreground">
				{$expense.data?.is_payment ? 'Payment' : 'Expense'}is_payment
			</p>
			<p class="text-sm text-muted-foreground">{$expense.data.metadata?.notes}</p>
			<p class="text-sm text-muted-foreground">{$expense.data.metadata?.receiptImageUrl}</p>
			<p class="text-sm text-muted-foreground">{$expense.data.metadata?.category}</p>
		</Item.Content>
	</Item.Root>
{:else if $expense.error}
	<Item.Root>
		<Item.Media>
			<ExclaimationCircle class="size-9" />
		</Item.Media>
		<Item.Content class="text-destructive-foreground">
			<p>Error loading expense {expenseId} {$expense.error.message}</p>
		</Item.Content>
	</Item.Root>
{/if}
