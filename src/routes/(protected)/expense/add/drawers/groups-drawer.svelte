<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Command from '$lib/components/ui/command';
	import * as Empty from '$lib/components/ui/empty';
	import UsersGroup from '@tabler/icons-svelte/icons/users-group';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';

	let { open = $bindable(false) }: { open: boolean } = $props();

	const ctx = getExpenseFormContext();
	const { group } = ctx;
	const api = trpc(page);

	const groupsQuery = $derived(
		api.group.list.createQuery({ limit: 20, offset: 0 }, { refetchInterval: Infinity })
	);
</script>

<Drawer.Root bind:open repositionInputs={false}>
	<Drawer.Content style="padding-bottom: env(keyboard-inset-height, 0px);">
		<div
			data-vaul-no-drag
			class="overflow-y-auto overscroll-contain"
			style="height: calc(90svh - env(keyboard-inset-height, 0px));"
		>
			<Command.Root class="flex flex-col bg-transparent">
				<Command.Input autofocus placeholder="Search groups..." />
				<Command.List class="max-h-full flex-1">
					<Command.Empty>
						<Empty.Root>
							<Empty.Header>
								<Empty.Media variant="icon">
									<UsersGroup />
								</Empty.Media>
								<Empty.Title>No Groups Found</Empty.Title>
							</Empty.Header>
						</Empty.Root>
					</Command.Empty>
					<Command.Group title="Groups">
						{#each $groupsQuery.data?.items ?? [] as grp}
							<Command.Item
								value={grp.id}
								keywords={[grp.name]}
								onSelect={() => {
									group.onChange(grp.id);
									open = false;
								}}
							>
								<b>{grp.name}</b>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</div>
	</Drawer.Content>
</Drawer.Root>
