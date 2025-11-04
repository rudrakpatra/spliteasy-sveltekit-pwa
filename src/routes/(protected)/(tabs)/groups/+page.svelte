<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import type { PageData } from './$types';
	import { trpc } from '$lib/trpc/client';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import UsersGroup from '@tabler/icons-svelte/icons/users-group';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import { page } from '$app/state';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import GroupSummary from './group-summary.svelte';
	import * as Item from '$lib/components/ui/item';

	let { data }: { data: PageData } = $props();
	const api = trpc(page, data.queryClient);
	const groupsQuery = api.group.list.createQuery(
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
	<title>Groups - SplitEasy</title>
</svelte:head>

{#if $groupsQuery.isPending}
	<div class="grid flex-1 place-items-center">
		<Label>
			<Spinner />Loading groups...
		</Label>
	</div>
{:else if $groupsQuery.isError}
	<div class="rounded-lg p-4">
		<p class="text-destructive">Error: {$groupsQuery.error.message}</p>
		<Button onclick={() => $groupsQuery.refetch()} class="mt-2" variant="outline" size="sm">
			Retry
		</Button>
	</div>
{:else if $groupsQuery.data.items.length > 0}
	<Item.Group>
		{#each $groupsQuery.data.items as group (group.id)}
			<a class="block" href={`/groups/${group.id}`}>
				<GroupSummary {group} />
			</a>
		{/each}
	</Item.Group>
{:else}
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<UsersGroup />
			</Empty.Media>
			<Empty.Title>No Groups Yet</Empty.Title>
			<Empty.Description>
				You haven't joined or created any groups yet. Get started by creating your first group or
				join an existing one.
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<div class="flex gap-2">
				<Button href="/group/add">Create Group</Button>
				<Button variant="outline">Join Group</Button>
			</div>
		</Empty.Content>
		<Button variant="link" class="text-muted-foreground" size="sm">
			<span>
				Learn More <ArrowUpRightIcon class="inline h-4 w-4" />
			</span>
		</Button>
	</Empty.Root>
{/if}

<div class="fab p-4">
	<Button href="/group/add"><Plus /> Group</Button>
</div>

<style>
	.fab {
		position: fixed;
		position-anchor: --app-footer;
		bottom: anchor(top);
		right: anchor(right);
	}
</style>
