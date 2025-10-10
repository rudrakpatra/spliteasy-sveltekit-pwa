<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import type { PageData } from './$types';
	import { trpc } from '$lib/trpc/client';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import UsersGroup from '@tabler/icons-svelte/icons/users-group';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import { page } from '$app/state';

	let { data }: { data: PageData } = $props();
	const api = trpc(page, data.queryClient);
	const groupsQuery = api.group.list.createQuery(undefined, {
		// initialData: data.groups, //enable this get prefetched data
		refetchInterval: Infinity
	});
</script>

<svelte:head>
	<title>Groups - SplitEasy</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<div class="bg-card rounded-lg border p-6 shadow-sm">
		<h1 class="mb-6 text-2xl font-bold">Groups</h1>

		<div class="space-y-6">
			{#if $groupsQuery.isPending}
				<div class="flex justify-center py-8">
					<p class="text-muted-foreground">Loading groups...</p>
				</div>
			{:else if $groupsQuery.isError}
				<div class="rounded-lg bg-red-50 p-4">
					<p class="text-red-500">Error: {$groupsQuery.error.message}</p>
					<Button onclick={() => $groupsQuery.refetch()} class="mt-2" variant="outline" size="sm">
						Retry
					</Button>
				</div>
			{:else if $groupsQuery.data?.length > 0}
				<div class="space-y-6">
					{#each $groupsQuery.data as group (group.id)}
						<a class="block" href={`/groups/${group.id}`}>
							<div class="flex items-center space-x-4">
								<Avatar.Root class="block size-20 text-4xl">
									<Avatar.Image src={group.img} alt={group.name} />
									<Avatar.Fallback>{group.name.charAt(0)}</Avatar.Fallback>
								</Avatar.Root>
								<div>
									<h2 class="text-lg font-semibold">{group.name}</h2>
									<p class="text-muted-foreground">{group.id}</p>
								</div>
							</div>
						</a>
					{/each}
				</div>
				<section class="fixed bottom-20 right-4">
					<Button href="/group/add" variant="default">Create Group</Button>
				</section>
			{:else}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<UsersGroup />
						</Empty.Media>
						<Empty.Title>No Groups Yet</Empty.Title>
						<Empty.Description>
							You haven't joined or created any groups yet. Get started by creating your first group
							or join an existing one.
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
		</div>
	</div>
</div>
