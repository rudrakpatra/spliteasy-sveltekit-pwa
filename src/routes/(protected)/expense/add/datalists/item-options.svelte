<script lang="ts">
	import { KeyboardAwareView } from '$lib/components/ui/view';
	import * as DataList from '$lib/components/ui/data-list';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import ArrowsSplit from '@tabler/icons-svelte/icons/arrows-split';
	import { VIBRATE_DURATION } from '$lib/constants';
	import { EmblaScrollArea } from '$lib/components/ui/embla-scroll-area';
	import { generateSplitId, getExpenseFormContext, type ItemId } from '../context.svelte';
	import { Button } from '$lib/components/ui/button';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import type { UserId } from '$lib/shared/schema/user';

	const api = trpc(page);

	const ctx = getExpenseFormContext();

	const membersQuery = $derived(
		api.group.getMembers.createQuery(
			{ groupId: ctx.groupId.current },
			{
				refetchInterval: Infinity,
				enabled: uuidSchema.safeParse(ctx.groupId.current).success
			}
		)
	);

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
			label: 'Split Equally',
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

				const selectedItems = new SvelteSet<ItemId>();
				Array.from(ctx.items).forEach(([id, item]) => {
					if (item.selected) selectedItems.add(id);
				});

				const shares = new SvelteMap<UserId, string>();
				$membersQuery.data?.forEach((member) => {
					shares.set(member.userId, '1');
				});

				ctx.splits.set(generateSplitId(), {
					itemIds: selectedItems,
					shares: shares
				});

				Array.from(ctx.items).forEach(([id, item]) => {
					ctx.items.set(id, {
						...item,
						selected: false
					});
				});
			}
		},
		{
			icon: ArrowsSplit,
			label: 'Split by Shares',
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

				const selectedItems = new SvelteSet<ItemId>();
				Array.from(ctx.items).forEach(([id, item]) => {
					if (item.selected) selectedItems.add(id);
				});

				ctx.splits.set(generateSplitId(), {
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
