<!-- routes/expense/create/components/category-drawer.svelte -->
<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Command from '$lib/components/ui/command';
	import * as Empty from '$lib/components/ui/empty';
	import { categories } from '$lib/shared/category/category';
	import Category from '@tabler/icons-svelte/icons/category';

	let {
		open = $bindable(),
		selectedCategory = $bindable()
	}: {
		open: boolean;
		selectedCategory: string | undefined;
	} = $props();
</script>

<Drawer.Root bind:open>
	<Drawer.Content class="h-[calc(100vh-16rem)]">
		<Command.Root class="flex flex-col bg-transparent">
			<Command.Input placeholder="Search categories..." />
			<Command.List class="max-h-full flex-1">
				<Command.Empty>
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<Category />
							</Empty.Media>
							<Empty.Title>No Categories Found</Empty.Title>
						</Empty.Header>
					</Empty.Root>
				</Command.Empty>
				<Command.Group>
					{#each Object.values(categories) as category}
						<Command.Item
							value={category.code}
							onSelect={() => {
								selectedCategory = category.code;
								open = false;
							}}
							class="flex items-center justify-between gap-2"
						>
							<b>{category.icon} {category.name}</b>
							<span class="text-xs text-muted-foreground/50">{category.description}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Drawer.Content>
</Drawer.Root>
