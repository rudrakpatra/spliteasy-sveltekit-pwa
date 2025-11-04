<script lang="ts">
	import { KeyboardAwareView } from '$lib/components/ui/view';
	import * as DataList from '$lib/components/ui/data-list';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import ArrowsSplit from '@tabler/icons-svelte/icons/arrows-split';
	import { VIBRATE_DURATION } from '$lib/constants';
	import { EmblaScrollArea } from '$lib/components/ui/embla-scroll-area';
	import { generateId, getExpenseFormContext, type Id } from '../context.svelte';
	import { Button } from '$lib/components/ui/button';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	const ctx = getExpenseFormContext();

	let { open = $bindable(false), id }: { open: boolean; id: string } = $props();

	const keys = [
		{
			icon: Trash,
			get show() {
				return Array.from(ctx.items).some(([id, item]) => item.selected);
			},
			label: 'Delete',
			onDown: (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				navigator.vibrate(VIBRATE_DURATION);
			},
			onClick: (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				Array.from(ctx.items).forEach(([id, item]) => {
					if (item.selected) ctx.items.delete(id);
				});
			}
		},
		{
			icon: ArrowsSplit,
			label: 'Split Items',
			get show() {
				return Array.from(ctx.items).some(([id, item]) => item.selected);
			},
			onDown: (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				navigator.vibrate(VIBRATE_DURATION);
			},
			onClick: (e: Event) => {
				e.preventDefault();
				e.stopPropagation();

				const selectedItems = new SvelteSet<Id>();
				Array.from(ctx.items).forEach(([id, item]) => {
					if (item.selected) selectedItems.add(id);
				});

				ctx.splits.set(generateId(), {
					itemIds: selectedItems,
					shares: new SvelteMap()
				});
				Array.from(ctx.items).forEach(([id, item]) => {
					ctx.items.set(id, {
						...item,
						selected: false
					});
				});
			}
		}
	];
</script>

<KeyboardAwareView>
	<DataList.Portal bind:open id={`items-${id}`}>
		<!-- backdrop -->
		<div class="absolute top-0 h-full w-full border-t border-border bg-background py-1"></div>
		<!-- scroll area -->
		<EmblaScrollArea class="h-full py-1" containerClass="flex items-center gap-2 px-2">
			{#each keys as key (key.label)}
				{@const Icon = key.icon}
				{#if key.show}
					<Button
						type="button"
						tabindex={3}
						class="rounded-full active:bg-accent active:text-accent-foreground"
						onpointerdown={key.onDown}
						onclick={key.onClick}
					>
						<Icon style="width: 24px; height: 20px;" />{key.label}
					</Button>
				{/if}
			{/each}
		</EmblaScrollArea>
	</DataList.Portal>
</KeyboardAwareView>
