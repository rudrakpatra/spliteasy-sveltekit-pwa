<script lang="ts">
	import type { PageData } from './$types';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import GroupSummary from '../group-summary.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Empty from '$lib/components/ui/empty';
	import UsersGroup from '@tabler/icons-svelte/icons/users-group';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Item from '$lib/components/ui/item';
	import * as Avatar from '$lib/components/ui/avatar';
	import Member from './member.svelte';
	import Expense from '../../dashboard/expense.svelte';
	import ExclaimationCircle from '@tabler/icons-svelte/icons/exclamation-circle';
	import Receipt from '@tabler/icons-svelte/icons/receipt';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import EmblaScrollArea from '$lib/components/ui/embla-scroll-area/embla-scroll-area.svelte';

	let { data }: { data: PageData } = $props();

	// Setup tRPC client
	const api = trpc(page, data.queryClient);

	// Derived stategroup
	let group = api.group.getById.createQuery({ id: data.groupId });
	let members = api.group.getMembers.createQuery({ groupId: data.groupId });
	let balances = api.group.getBalances.createQuery({ groupId: data.groupId });
	let finalized = api.expense.getFinalized.createQuery({
		groupId: data.groupId,
		limit: 20,
		offset: 0
	});
	let proposed = api.expense.getProposed.createQuery({
		groupId: data.groupId,
		limit: 20,
		offset: 0
	});

	let tab = $state('members');
	let tabList = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!tabList) return;
		//find the tab with data-value=tab
		for (let child of tabList.children) {
			if (child.getAttribute('data-value') === tab) {
				child.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}
	});
</script>

<svelte:head>
	<title>{$group.data?.name ?? 'Group'} - SplitEasy</title>
</svelte:head>

{#if $group.isPending}
	<div class="grid flex-1 place-items-center">
		<Label>
			<Spinner />Loading group...
		</Label>
	</div>
{:else if $group.isError}
	<Item.Root>
		<Item.Media class="text-destructive">
			<ExclaimationCircle class="size-9" />
		</Item.Media>
		<Item.Content>
			<Item.Title>Error Loading Group</Item.Title>
			<Item.Description>
				{$group.error.message}
			</Item.Description>
		</Item.Content>
		<Item.Actions>
			<Button onclick={() => $group.refetch()} variant="outline" size="sm">Retry</Button>
		</Item.Actions>
	</Item.Root>
{:else}
	<GroupSummary group={$group.data} />
	<Tabs.Root bind:value={tab}>
		<Item.Root>
			<Item.Content class="max-w-full">
				<!-- <EmblaScrollArea
					class="h-9 rounded-lg bg-muted p-[3px] text-muted-foreground"
					options={{ dragFree: false }}
				>
					<Tabs.Trigger value="settle">Settle Up</Tabs.Trigger>
					<Tabs.Trigger value="finalized">Finalized</Tabs.Trigger>
					<Tabs.Trigger value="proposals">Proposals</Tabs.Trigger>
					<Tabs.Trigger value="members">Members</Tabs.Trigger>
					<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				</EmblaScrollArea> -->
				<Tabs.List bind:ref={tabList} class="mx-auto max-w-full justify-start overflow-x-scroll">
					<Tabs.Trigger value="settle">Settle Up</Tabs.Trigger>
					<Tabs.Trigger value="finalized">Finalized</Tabs.Trigger>
					<Tabs.Trigger value="proposals">Proposals</Tabs.Trigger>
					<Tabs.Trigger value="members">Members</Tabs.Trigger>
					<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				</Tabs.List>
			</Item.Content>
		</Item.Root>
		<Tabs.Content value="settle">
			{#if $members.isSuccess}
				{#if $balances.isPending}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<Spinner />
							</Empty.Media>
							<Empty.Title>Loading Balances...</Empty.Title>
							<Empty.Description>
								{$balances.status}
							</Empty.Description>
						</Empty.Header>
					</Empty.Root>
				{:else if $balances.isError}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<ExclaimationCircle class="text-destructive" />
							</Empty.Media>
							<Empty.Title>Error Loading Balances</Empty.Title>
							<Empty.Description>
								{$balances.error.message}
							</Empty.Description>
						</Empty.Header>
						<Empty.Content class="flex gap-2">
							<Button onclick={() => $balances.refetch()} variant="destructive" size="sm">
								Retry
							</Button>
						</Empty.Content>
					</Empty.Root>
				{:else if $balances.data}
					<Item.Group class="space-y-6">
						{#each Object.entries($balances.data) as [user_id, balance] (user_id)}
							{@const member = $members.data.find((member) => member.user_id === user_id)}
							{#if member}
								<Item.Root>
									<Item.Media>
										<Avatar.Root>
											<Avatar.Image src={member.user.img} alt={member.user.name} />
											<Avatar.Fallback>{member.user.name.slice(0, 2).toUpperCase()}</Avatar.Fallback
											>
										</Avatar.Root>
									</Item.Media>
									<Item.Content>
										<Item.Title>{member.user.name}</Item.Title>
										<Item.Description>
											{member.user.email}
										</Item.Description>
									</Item.Content>
									{#each Object.entries(balance) as [key, value]}
										<Item.Content>
											<Item.Title>{key}</Item.Title>
											<Item.Description>{value}</Item.Description>
										</Item.Content>
									{/each}
								</Item.Root>
							{/if}
						{/each}
					</Item.Group>
				{:else}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<UsersGroup />
							</Empty.Media>
							<Empty.Title>No Balances Found</Empty.Title>
							<Empty.Description>No balances found in this group.</Empty.Description>
						</Empty.Header>
						<Button variant="link" class="text-muted-foreground" size="sm">
							<span>
								Learn More <ArrowUpRight class="inline h-4 w-4" />
							</span>
						</Button>
					</Empty.Root>
				{/if}
			{/if}
		</Tabs.Content>
		<Tabs.Content value="finalized">
			{#if $finalized.isPending}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<Spinner />
						</Empty.Media>
						<Empty.Title>Loading Finalized Expenses...</Empty.Title>
						<Empty.Description>
							{$finalized.status}
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else if $finalized.isError}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<ExclaimationCircle class="text-destructive" />
						</Empty.Media>
						<Empty.Title>Error Loading Finalized Expenses</Empty.Title>
						<Empty.Description>
							{$finalized.error.message}
						</Empty.Description>
					</Empty.Header>
					<Empty.Content class="flex gap-2">
						<Button onclick={() => $finalized.refetch()} variant="destructive" size="sm">
							Retry
						</Button>
					</Empty.Content>
				</Empty.Root>
			{:else if $finalized.data.items.length > 0}
				<Item.Group class="space-y-6">
					{#each $finalized.data.items as expense (expense.id)}
						<Expense expenseId={expense.id} />
					{/each}
				</Item.Group>
			{:else}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<Receipt />
						</Empty.Media>
						<Empty.Title>No Finalized Expenses Yet</Empty.Title>
						<Empty.Description>
							You haven't finalized any expenses yet. Get started by creating your first expense.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content class="flex gap-2">
						<TabsPrimitive.Trigger value="proposals">
							<Button>Go to Proposals</Button>
						</TabsPrimitive.Trigger>
					</Empty.Content>
					<Button variant="link" class="text-muted-foreground" size="sm">
						<span>
							Learn More <ArrowUpRight class="inline h-4 w-4" />
						</span>
					</Button>
				</Empty.Root>
			{/if}
		</Tabs.Content>
		<Tabs.Content value="proposals">
			{#if $proposed.isPending}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<Spinner />
						</Empty.Media>
						<Empty.Title>Loading Proposed Expenses...</Empty.Title>
						<Empty.Description>
							{$proposed.status}
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else if $proposed.isError}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<ExclaimationCircle class="text-destructive" />
						</Empty.Media>
						<Empty.Title>Error Loading Proposed Expenses</Empty.Title>
						<Empty.Description>
							{$proposed.error.message}
						</Empty.Description>
					</Empty.Header>
					<Empty.Content class="flex gap-2">
						<Button onclick={() => $proposed.refetch()} variant="destructive" size="sm">
							Retry
						</Button>
					</Empty.Content>
				</Empty.Root>
			{:else if $proposed.data.items.length > 0}
				<Item.Group class="space-y-6">
					{#each $proposed.data.items as expense (expense.id)}
						<Expense expenseId={expense.id} />
					{/each}
				</Item.Group>
			{:else}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<Receipt />
						</Empty.Media>
						<Empty.Title>No Proposals Yet</Empty.Title>
						<Empty.Description>
							There is no proposed expenses yet. Get started by creating your first expense.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content class="flex gap-2">
						<Button href="/expense/add">Create Expense</Button>
						<!-- <Button variant="outline">Add Expense</Button> -->
					</Empty.Content>
					<Button variant="link" class="text-muted-foreground" size="sm">
						<span>
							Learn More <ArrowUpRight class="inline h-4 w-4" />
						</span>
					</Button>
				</Empty.Root>
			{/if}
		</Tabs.Content>
		<Tabs.Content value="balances">
			{#if $members.isSuccess}
				{#if $balances.isPending}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<Spinner />
							</Empty.Media>
							<Empty.Title>Loading Balances...</Empty.Title>
							<Empty.Description>
								{$balances.status}
							</Empty.Description>
						</Empty.Header>
					</Empty.Root>
				{:else if $balances.isError}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<ExclaimationCircle class="text-destructive" />
							</Empty.Media>
							<Empty.Title>Error Loading Balances</Empty.Title>
							<Empty.Description>
								{$balances.error.message}
							</Empty.Description>
						</Empty.Header>
						<Empty.Content class="flex gap-2">
							<Button onclick={() => $balances.refetch()} variant="destructive" size="sm">
								Retry
							</Button>
						</Empty.Content>
					</Empty.Root>
				{:else if $balances.data}{:else}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<UsersGroup />
							</Empty.Media>
							<Empty.Title>No Balances Found</Empty.Title>
							<Empty.Description>No balances found in this group.</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<div class="flex gap-2">
								<Button href={`/groups/${data.groupId}/member/add`}>Add Member</Button>
								<Button variant="outline">Invite Link</Button>
							</div>
						</Empty.Content>
						<Button variant="link" class="text-muted-foreground" size="sm">
							<span>
								Learn More <ArrowUpRight class="inline h-4 w-4" />
							</span>
						</Button>
					</Empty.Root>
				{/if}
			{/if}
		</Tabs.Content>
		<Tabs.Content value="members">
			{#if $members.isPending}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<Spinner />
						</Empty.Media>
						<Empty.Title>Loading Members...</Empty.Title>
						<Empty.Description>
							{$members.status}
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else if $members.isError}
				<Item.Root>
					<Item.Media class="text-destructive">
						<ExclaimationCircle class="size-9" />
					</Item.Media>
					<Item.Content>
						<Item.Title>Error Loading Members</Item.Title>
						<Item.Description>
							{$members.error.message}
						</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Button onclick={() => $members.refetch()} variant="outline" size="sm">Retry</Button>
					</Item.Actions>
				</Item.Root>
			{:else if $members.data.length > 0}
				<Item.Group>
					{#each $members.data as member (member.user_id)}
						<Member userId={member.user_id} />
					{/each}
				</Item.Group>
			{:else}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<UsersGroup />
						</Empty.Media>
						<Empty.Title>No Group Members</Empty.Title>
						<Empty.Description>No members found in this group.</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<div class="flex gap-2">
							<Button href="/groups/[id]/member/add">Add Member</Button>
							<Button variant="outline">Invite Link</Button>
						</div>
					</Empty.Content>
					<Button variant="link" class="text-muted-foreground" size="sm">
						<span>
							Learn More <ArrowUpRight class="inline h-4 w-4" />
						</span>
					</Button>
				</Empty.Root>
			{/if}
		</Tabs.Content>
		<Tabs.Content value="settings"></Tabs.Content>
	</Tabs.Root>
{/if}

<div class="fab flex flex-col gap-2 p-4">
	{#if tab === 'members'}
		<Button href={`/groups/${data.groupId}/member/add`}><Plus /> Member</Button>
	{/if}
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
