<!-- routes/expense/create/components/group-drawer.svelte -->
<script lang="ts">
    import * as Drawer from '$lib/components/ui/drawer';
    import * as Command from '$lib/components/ui/command';
    import * as Empty from '$lib/components/ui/empty';
    import UsersGroup from '@tabler/icons-svelte/icons/users-group';

    let {
        open = $bindable(),
        groupsQuery,
        selectedGroupId = $bindable()
    }: {
        open: boolean;
        groupsQuery: any;
        selectedGroupId: string;
    } = $props();
</script>

<Drawer.Root bind:open>
    <Drawer.Content class="h-[calc(100vh-16rem)]">
        <Command.Root class="bg-transparent">
            <Command.Input placeholder="Search groups..." />
            <Command.List>
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
                <Command.Group>
                    {#each $groupsQuery.data?.items as group}
                        <Command.Item
                            value={group.name}
                            onSelect={() => {
                                selectedGroupId = group.id;
                                open = false;
                            }}
                        >
                            <b>{group.name}</b>
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.List>
        </Command.Root>
    </Drawer.Content>
</Drawer.Root>
