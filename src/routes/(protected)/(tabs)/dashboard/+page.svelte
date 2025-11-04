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
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Item from '$lib/components/ui/item';
	import ExclaimationCircle from '@tabler/icons-svelte/icons/exclamation-circle';

	let { data }: { data: PageData } = $props();
	const api = trpc(page, data.queryClient);
	const pendingApprovalsQuery = api.user.getPendingApprovals.createQuery(
		{
			limit: 20,
			offset: 0
		},
		{
			// initialData: data.groups, //enable this get prefetched data
			refetchInterval: Infinity
		}
	);
</script>

<svelte:head>
	<title>Dashboard - SplitEasy</title>
</svelte:head>

{#if $pendingApprovalsQuery.isPending}
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<Spinner />
			</Empty.Media>
			<Empty.Title>Loading Expenses...</Empty.Title>
			<Empty.Description>
				{$pendingApprovalsQuery.status}
			</Empty.Description>
		</Empty.Header>
	</Empty.Root>
{:else if $pendingApprovalsQuery.isError}
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<ExclaimationCircle />
			</Empty.Media>
			<Empty.Title>Error</Empty.Title>
			<Empty.Description>
				{$pendingApprovalsQuery.error.message}
			</Empty.Description>
		</Empty.Header>
		<Empty.Content class="flex gap-2">
			<Button onclick={() => $pendingApprovalsQuery.refetch()}>Retry</Button>
		</Empty.Content>
	</Empty.Root>
{:else if $pendingApprovalsQuery.data.items.length > 0}
	<Item.Group>
		{#each $pendingApprovalsQuery.data.items as expense (expense.id)}
			<Expense expenseId={expense.id} />
		{/each}
	</Item.Group>
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
		<Empty.Content class="flex gap-2">
			<Button href="/expense/add">Create Expense</Button>
			<!-- <Button variant="outline">Add Expense</Button> -->
		</Empty.Content>
		<Button variant="link" class="text-muted-foreground" size="sm">
			<span>
				Learn More <ArrowUpRightIcon class="inline h-4 w-4" />
			</span>
		</Button>
	</Empty.Root>
{/if}

<div class="fab p-4">
	<Button href="/expense/add"><Plus /> Expense</Button>
</div>

<style>
	.fab {
		position: fixed;
		position-anchor: --app-footer;
		bottom: anchor(top);
		right: anchor(right);
	}
</style>
