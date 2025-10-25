<script lang="ts">
	import { generateItemId, getExpenseFormContext } from '../context.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import CheckboxButton from '../checkbox-button.svelte';
	import CheckboxGroup from '../checkbox-group.svelte';
	import Calculator from '../datalists/calculator.svelte';
	import { useActiveElement } from '$lib/hooks/activeElement/active-element-context.svelte';
	import LockSquareRoundedFilled from '@tabler/icons-svelte/icons/lock-square-rounded-filled';
	import { evaluateAmountExpression } from '$lib/shared/schema/math';
	import { page } from '$app/state';
	import { trpc } from '$lib/trpc/client';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import ItemOptions from '../datalists/item-options.svelte';
	import { cn } from '$lib/utils';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import AiReceiptDialog from './ai-receipt-dialog.svelte';

	const ctx = getExpenseFormContext();

	const api = trpc(page);

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
	const unfilledCount = $derived(itemcount - filledCount);
	const itemAmount = $derived(
		Array.from(ctx.items.values()).reduce(
			(acc, item) => acc + (evaluateAmountExpression(item.amount) || 0),
			0
		)
	);
	const payerAmount = $derived(
		Array.from(ctx.payers.values()).reduce(
			(acc, payer) => acc + (evaluateAmountExpression(payer.amount) || 0),
			0
		)
	);
	const remaining = $derived.by(() => {
		const remainingAmount = (payerAmount - itemAmount) / unfilledCount;
		return isNaN(remainingAmount) || !isFinite(remainingAmount)
			? (0).toFixed(ctx.currency.digits)
			: remainingAmount.toFixed(ctx.currency.digits);
	});

	// Auto-add empty item row - use immutable updates
	$effect(() => {
		if (filledCount === itemcount || itemcount === 0) {
			ctx.items.set(generateItemId(), {
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
	{#if itemcount == 0}
		<Skeleton class="h-9 w-full" />
	{:else}
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
								placeholder={remaining}
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
		<AiReceiptDialog />
		<p class="text-xs text-muted-foreground">
			{#if itemcount > 0}
				{filledCount} / {itemcount} Filled item{itemcount === 1 ? '' : 's'}
			{:else}
				Add items and assign value
			{/if}
		</p>
	{/if}
</div>

<ItemOptions open={openItemOptions} id={cid} />
<Calculator open={calculatorOpen} id={cid} />
