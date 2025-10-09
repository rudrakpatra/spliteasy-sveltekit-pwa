<script lang="ts">
	import type { PageData } from './$types';
	import { createQuery } from '@tanstack/svelte-query';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import UsersGroup from '@tabler/icons-svelte/icons/users-group';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

	let { data }: { data: PageData } = $props();

	const query = createQuery(() => ({
		queryKey: ['groups'],
		queryFn: async () => (await fetch('/api/groups')).json()
	}));
</script>

<svelte:head>
	<title>Groups - SplitEasy</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<div class="bg-card rounded-lg border p-6 shadow-sm">
		<h1 class="mb-6 text-2xl font-bold">Groups</h1>

		<div class="space-y-6">
			{#if query.isPending}
				<div class="flex justify-center py-8">
					<p class="text-muted-foreground">Loading groups...</p>
				</div>
			{:else if query.isError}
				<div class="rounded-lg bg-red-50 p-4">
					<p class="text-red-500">Error: {query.error.message}</p>
					<Button onclick={() => query.refetch()} class="mt-2" variant="outline" size="sm">
						Retry
					</Button>
				</div>
			{:else if query.data?.groupsData && query.data.groupsData.length > 0}
				{#each query.data.groupsData as group (group.id)}
					<div class="flex items-center space-x-4">
						<img src={group.img} alt={group.name} class="h-20 w-20 rounded-full" />
						<div>
							<h2 class="text-xl font-semibold">{group.name}</h2>
							<p class="text-muted-foreground">{group.id}</p>
						</div>
					</div>
				{/each}
			{:else}
				<!-- Empty State -->
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
