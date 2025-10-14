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
	let balances = api.group.getBalances.createQuery({ groupId: data.id });
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
		{JSON.stringify($balances.data?.items)}

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
	</div>
{/if}
