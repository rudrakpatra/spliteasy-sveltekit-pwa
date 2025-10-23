<script lang="ts">
	import { KeyboardAwareView } from '$lib/components/ui/view';
	import * as DataList from '$lib/components/ui/data-list';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import ArrowsSplit from '@tabler/icons-svelte/icons/arrows-split';
	import { VIBRATE_DURATION } from '$lib/constants';
	import { EmblaScrollArea } from '$lib/components/ui/embla-scroll-area';
	import { generateId, getExpenseFormContext } from '../context.svelte';
	import { Button } from '$lib/components/ui/button';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { uuidSchema } from '$lib/shared/schema/uuid';

	const api = trpc(page);

	const ctx = getExpenseFormContext();
	const { form } = ctx;
	const { form: formData } = form;

	// Helper function for clean updates
	function updateFormData(updater: (snapshot: typeof $formData) => void) {
		const snapshot = $state.snapshot($formData);
		updater(snapshot);
		formData.set(snapshot);
	}

	const membersQuery = $derived(
		api.group.getMembers.createQuery(
			{ groupId: $formData.groupId },
			{
				refetchInterval: Infinity,
				enabled: uuidSchema.safeParse($formData.groupId).success
			}
		)
	);

	const members = $derived($membersQuery.data);

	let { open = $bindable(false), id }: { open: boolean; id: string } = $props();

	const keys = [
		{
			icon: Trash,
			get show() {
				return ctx.items.selected.size > 0;
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
				updateFormData((snapshot) => {
					// Filter out selected items
					snapshot.items = snapshot.items.filter((i) => !ctx.items.selected.has(i.id));

					// Also remove these items from any splits and clean up empty splits
					snapshot.splits = snapshot.splits
						.map((split) => ({
							...split,
							itemIds: split.itemIds.filter((itemId) => !ctx.items.selected.has(itemId))
						}))
						.filter((split) => split.itemIds.length > 0);
					ctx.items.selected.clear();
				});
			}
		},
		{
			icon: ArrowsSplit,
			label: 'Split',
			get show() {
				return ctx.items.selected.size > 0;
			},
			onDown: (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				navigator.vibrate(VIBRATE_DURATION);
			},
			onClick: (e: Event) => {
				e.preventDefault();
				e.stopPropagation();

				updateFormData((snapshot) => {
					snapshot.splits.push({
						id: generateId(),
						itemIds: Array.from(ctx.items.selected.values()),
						shares:
							members?.map((m) => ({
								userId: m.userId,
								shareExpression: '0'
							})) || []
					});
				});
				ctx.items.selected.clear();
			}
		}
	];
</script>

<KeyboardAwareView>
	<DataList.Portal bind:open id={`items-${id}`}>
		<!-- backdrop -->
		<div class="absolute top-0 h-full w-full border-t-1 border-border bg-background py-1"></div>
		<!-- scroll area -->
		<EmblaScrollArea class="h-full py-1" containerClass="flex items-center gap-2 px-2">
			{#each keys as key (key.label)}
				{@const Icon = key.icon}
				{#if key.show}
					<Button
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
