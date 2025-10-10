<script lang="ts">
	import type { PageData } from './$types';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import Member from './member.svelte';

	let { data }: { data: PageData } = $props();

	// Setup tRPC client
	const api = trpc(page, data.queryClient);

	// Derived stategroup
	let group = api.group.getById.createQuery({ id: data.id });
	let members = api.group.getMembers.createQuery({ groupId: data.id });
	// let expenses = $derived(api.expenses.listByGroup.query({ groupId: data.groupId }));
</script>

<svelte:head>
	<title>{$group.data?.name ?? 'Group'} - SplitEasy</title>
</svelte:head>

{#if $group.data}
	<div class="container mx-auto max-w-4xl px-4 py-8">
		<!-- Group Header -->
		<Card.Root class="mb-6">
			<Card.Header>
				<div class="flex items-center gap-4">
					<Avatar class="h-16 w-16">
						<AvatarImage src={$group.data.img} alt={$group.data.name} />
						<AvatarFallback>
							{$group.data.name.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>

					<div class="flex-1">
						<Card.Title class="text-2xl">{$group.data.name}</Card.Title>
						<Card.Description>
							{$members.data?.length}
							{$members.data?.length === 1 ? 'member' : 'members'} ·
							{$group.data.createdAt.toLocaleDateString()}
						</Card.Description>
					</div>
				</div>
			</Card.Header>
		</Card.Root>

		<!-- Members Section -->
		<Card.Root class="mb-6">
			<Card.Header>
				<div class="flex items-center justify-between">
					<Card.Title>Members</Card.Title>
					<Button variant="outline" onclick={() => goto(`/group/${data.id}/member/add`)}>
						Add Member
					</Button>
				</div>
			</Card.Header>

			<Card.Content>
				{#if $members.isLoading}
					<p class="text-muted-foreground">Loading members...</p>
				{:else if $members.data?.length === 0}
					<p class="text-muted-foreground">No members yet. Add some!</p>
				{:else}
					<div class="space-y-3">
						{#each $members.data as member}
							<Member userId={member.userId} />
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Expenses Section -->
		<!-- <Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<Card.Title>Expenses</Card.Title>
					<Button onclick={() => goto(`/group/${data.id}/add-expense`)}>Add Expense</Button>
				</div>
			</Card.Header>

			<Card.Content>
				{#if $expensesQuery.isLoading}
					<p class="text-muted-foreground">Loading expenses...</p>
				{:else if expenses.length === 0}
					<p class="text-muted-foreground">No expenses yet. Start tracking!</p>
				{:else}
					<div class="space-y-3">
						{#each expenses as expense}
							<div
								class="hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-3"
								onclick={() => goto(`/expense/${expense.id}`)}
							>
								<div class="flex-1">
									<p class="font-medium">{expense.description}</p>
									<p class="text-muted-foreground text-sm">
										Paid by {expense.paidBy.name}
									</p>
								</div>
								<div class="text-right">
									<p class="font-semibold">₹{expense.amount.toFixed(2)}</p>
									<p class="text-muted-foreground text-sm">
										{new Date(expense.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root> -->
	</div>
{/if}
