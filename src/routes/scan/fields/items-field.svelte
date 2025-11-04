<script lang="ts">
	import { generateId, getExpenseFormContext } from '../context.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import CheckboxButton from '../checkbox-button.svelte';
	import CheckboxGroup from '../checkbox-group.svelte';
	import Calculator from '../datalists/calculator.svelte';
	import { useActiveElement } from '$lib/hooks/activeElement/active-element-context.svelte';
	import LockSquareRoundedFilled from '@tabler/icons-svelte/icons/lock-square-rounded-filled';
	import ItemOptions from '../datalists/item-options.svelte';
	import { cn } from '$lib/utils';

	const ctx = getExpenseFormContext();

	// Component ID for unique input IDs
	const cid = $props.id();

	// Use $derived.by for computed values that depend on reactive state
	const itemcount = $derived(ctx.items.size);
	const selectedCount = $derived(
		Array.from(ctx.items.values()).filter((item) => item.selected).length
	);
	const filledCount = $derived(
		Array.from(ctx.items.values()).filter((item) => item.amount !== '').length
	);

	// Auto-add empty item row - use immutable updates
	$effect(() => {
		if (filledCount === itemcount || itemcount === 0) {
			ctx.items.set(generateId(), {
				name: '',
				amount: '',
				selected: false
			});
		}
	});

	// Active element tracking for calculator
	const activeElement = useActiveElement();
	const calculatorOpen = $derived.by(() => {
		const current = activeElement.current;
		// Match id={`${cid}.item.${id}.amt`} using regex
		return current?.id.match(new RegExp(`^${cid}\\.item\\..+\\.amt$`)) !== null || false;
	});

	const openItemOptions = $derived(selectedCount > 0 && !calculatorOpen);
</script>

<div class="space-y-2">
	<Label>Items</Label>
	{#snippet table()}
		<div class={cn(ctx.ai.pendingFields.has('items') && 'ai-pending')}>
			<CheckboxGroup groupId="items-group">
				<section
					class="grid grid-cols-[auto_auto_1fr] items-center gap-2 overflow-x-auto rounded-md px-3 py-2 outline outline-border"
				>
					{#each ctx.items as [id, item] (id)}
						{@const split = Array.from(ctx.splits.values()).find((split) => split.itemIds.has(id))}
						<div>
							{#if split}
								<LockSquareRoundedFilled
									onclick={(e) => {
										e.preventDefault();
										split.itemIds.delete(id);
									}}
								/>
							{:else}
								<CheckboxButton
									id={`${cid}.item.${id}.select`}
									tabindex={2}
									checked={item.selected}
									onCheckedChange={(checked) => {
										ctx.items.set(id, {
											...item,
											selected: checked
										});
									}}
								/>
							{/if}
						</div>

						<div>
							<Input
								id={`${cid}.item.${id}.name`}
								type="text"
								value={item.name}
								oninput={(e) => {
									ctx.items.set(id, {
										...item,
										name: e.currentTarget.value
									});
								}}
								placeholder={`#${id}`}
								variant="underlined"
								class="field-sizing-content max-w-30 min-w-9 truncate text-left"
								autocomplete="off"
								inputmode="text"
								data-scroll-into-view="true"
								tabindex={3}
							/>
						</div>

						<label class="grid grid-cols-[1fr_auto]">
							<span></span>
							<Input
								id={`${cid}.item.${id}.amt`}
								type="text"
								placeholder={ctx.remainingAmount}
								variant="underlined"
								class="field-sizing-content max-w-30 min-w-9 truncate text-center"
								autocomplete="off"
								inputmode="numeric"
								data-scroll-into-view="true"
								value={item.amount}
								oninput={(e) => {
									ctx.items.set(id, {
										...item,
										amount: e.currentTarget.value
									});
								}}
								tabindex={4}
							/>
						</label>
					{/each}
				</section>
			</CheckboxGroup>
		</div>
	{/snippet}
	{#if ctx.ai.file.current}
		<img
			class="aspect-square h-32 rounded-md object-cover"
			src={ctx.ai.file.current.blobUrl}
			alt="Receipt"
		/>
	{/if}
	{@render table()}

	<p class="text-xs text-muted-foreground">
		{#if itemcount > 0}
			{itemcount} Total items
		{:else}
			Add items and assign value
		{/if}
	</p>
</div>

<ItemOptions open={openItemOptions} id={cid} />
<Calculator open={calculatorOpen} id={cid} />
