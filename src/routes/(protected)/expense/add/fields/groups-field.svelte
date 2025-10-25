<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import ChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import GroupsDrawer from '../drawers/groups-drawer.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Avatar from '$lib/components/ui/avatar';
	import { getExpenseFormContext } from '../context.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';

	const ctx = getExpenseFormContext();

	const api = trpc(page);
	let groupDrawerOpen = $state(false);

	const groupsQuery = $derived(
		api.group.list.createQuery({ limit: 20, offset: 0 }, { refetchInterval: Infinity })
	);

	// Auto set the group
	$effect(() => {
		if ($groupsQuery.isSuccess) {
			if (!ctx.groupId.current) {
				ctx.groupId.set($groupsQuery.data?.items[0].id);
			}
		}
	});

	let group = $derived($groupsQuery.data?.items.find((f) => f.id === ctx.groupId.current));
</script>

<div class="space-y-2">
	{#snippet trigger()}
		<Button onclick={() => (groupDrawerOpen = true)} variant="outline" type="button">
			{#if group}
				<Avatar.Root class="size-6">
					<Avatar.Image src={group.img} />
				</Avatar.Root>
				{group.name}
			{:else}
				{#if $groupsQuery.isLoading}<Spinner />{/if}Select Group
			{/if}
			<ChevronDown />
		</Button>
	{/snippet}
	<Label>Group</Label>
	{@render trigger()}
	<p class="text-xs text-muted-foreground">Choose a group to add this expense to</p>
</div>

<GroupsDrawer bind:open={groupDrawerOpen} />
