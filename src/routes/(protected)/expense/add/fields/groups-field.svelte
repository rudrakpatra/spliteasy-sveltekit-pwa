<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Button } from '$lib/components/ui/button';
	import ChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import GroupsDrawer from '../drawers/groups-drawer.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { Spinner } from '$lib/components/ui/spinner';
	import { untrack } from 'svelte';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import * as Avatar from '$lib/components/ui/avatar';
	import { toast } from 'svelte-sonner';

	const ctx = getExpenseFormContext();
	const { form, group } = ctx;
	const { form: formData } = form;

	const api = trpc(page);
	let groupDrawerOpen = $state(false);

	const groupsQuery = $derived(
		api.group.list.createQuery({ limit: 20, offset: 0 }, { refetchInterval: Infinity })
	);

	// Auto set the group
	$effect(() => {
		if ($groupsQuery.isSuccess && $formData) {
			const currentGroupId = untrack(() => $formData.groupId);
			if (!currentGroupId) {
				const parsed = uuidSchema.safeParse($groupsQuery.data?.items[0].id);
				if (parsed.success) {
					ctx.group.onChange(parsed.data);
				}
			}
		}
	});

	let selectedGroup = $derived($groupsQuery.data?.items.find((f) => f.id === group.current));
</script>

<Form.Field {form} name="groupId">
	<Form.Control>
		{#snippet children({ props })}
			{#snippet trigger()}
				<Button {...props} onclick={() => (groupDrawerOpen = true)} variant="outline" type="button">
					{#if selectedGroup}
						<Avatar.Root class="size-6">
							<Avatar.Image src={selectedGroup.img} />
						</Avatar.Root>
						{selectedGroup.name}
					{:else}
						{#if $groupsQuery.isLoading}<Spinner />{/if}Select Group
					{/if}
					<ChevronDown />
				</Button>
			{/snippet}
			<Form.Label>Group</Form.Label>
			{@render trigger()}
		{/snippet}
	</Form.Control>
	<Form.Description>Choose a group to add this expense to</Form.Description>
	<Form.FieldErrors />
</Form.Field>

<GroupsDrawer bind:open={groupDrawerOpen} />
