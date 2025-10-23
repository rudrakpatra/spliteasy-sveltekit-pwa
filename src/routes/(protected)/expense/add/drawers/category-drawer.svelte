<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Command from '$lib/components/ui/command';
	import * as Empty from '$lib/components/ui/empty';
	import { categories } from '$lib/shared/category/category';
	import Category from '@tabler/icons-svelte/icons/category';

	let { open = $bindable(false) }: { open: boolean } = $props();

	const ctx = getExpenseFormContext();
	const { form } = ctx;
	const { form: formData } = form;
</script>

<Drawer.Root bind:open repositionInputs={false}>
	<Drawer.Content style="padding-bottom: env(keyboard-inset-height, 0px);">
		<div
			data-vaul-no-drag
			class="overflow-y-auto overscroll-contain"
			style="height: calc(90svh - env(keyboard-inset-height, 0px));"
		>
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
					<Command.Group title="Categories" id="categories">
						{#each Object.values(categories) as category}
							<Command.Item
								class="flex flex-col justify-start gap-2 px-3 py-2 text-center aria-selected:bg-transparent"
								value={category.code}
								keywords={[category.code, category.name]}
								onSelect={() => {
									$formData.category = category.code;
									open = false;
								}}
							>
								<span class="text-4xl">{category.icon}</span>
								<span class="text-sm font-semibold">{category.name}</span>
								<span class="text-xs text-muted-foreground">{category.description}</span>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</div>
	</Drawer.Content>
</Drawer.Root>

<style>
	:global(#categories [data-command-group-items]) {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
	}

	:global(#categories [cmdk-group-items]) {
		display: contents;
	}
</style>
