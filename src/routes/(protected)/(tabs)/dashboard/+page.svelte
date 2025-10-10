<script lang="ts">
	import type { PageData } from './$types';
	import { trpc } from '$lib/trpc/client';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import { page } from '$app/state';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import Expense from './expense.svelte';
	import Receipt from '@tabler/icons-svelte/icons/receipt';

	let { data }: { data: PageData } = $props();
	const api = trpc(page, data.queryClient);
	const expensesQuery = api.expense.list.createQuery(undefined, {
		// initialData: data.groups, //enable this get prefetched data
		refetchInterval: Infinity
	});
</script>

<svelte:head>
	<title>Dashboard - SplitEasy</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<div class="bg-card rounded-lg border p-6 shadow-sm">
		<div class="flex justify-between">
			<h1 class="mb-6 text-2xl font-bold">Dashboard</h1>
			<Button href="/expense/add" variant="ghost">Add <Plus class="h-4 w-4" /></Button>
		</div>
		<div class="space-y-6">
			{#if $expensesQuery.isPending}
				<div class="flex justify-center py-8">
					<p class="text-muted-foreground">Loading expenses...</p>
				</div>
			{:else if $expensesQuery.isError}
				<div class="rounded-lg bg-red-50 p-4">
					<p class="text-red-500">Error: {$expensesQuery.error.message}</p>
					<Button onclick={() => $expensesQuery.refetch()} class="mt-2" variant="outline" size="sm">
						Retry
					</Button>
				</div>
			{:else if $expensesQuery.data?.length > 0}
				<div class="space-y-6">
					{#each $expensesQuery.data as expense (expense.id)}
						<Expense expenseId={expense.id} />
					{/each}
				</div>
			{:else}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<Receipt />
						</Empty.Media>
						<Empty.Title>No Expenses Yet</Empty.Title>
						<Empty.Description>
							You haven't created any expenses yet. Get started by creating your first expense.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<div class="flex gap-2">
							<Button href="/expense/add">Create Expense</Button>
							<!-- <Button variant="outline">Add Expense</Button> -->
						</div>
					</Empty.Content>
					<Button variant="link" class="text-muted-foreground" size="sm">
						<span>
							Learn More <ArrowUpRightIcon class="inline h-4 w-4" />
						</span>
					</Button>
				</Empty.Root>
			{/if}
		</div>
	</div>
</div>
