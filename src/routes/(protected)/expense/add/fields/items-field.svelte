<script lang="ts">
	import { generateId, getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import CheckboxButton from '../checkbox-button.svelte';
	import CheckboxGroup from '../checkbox-group.svelte';
	import Calculator from '../datalists/calculator.svelte';
	import { useActiveElement } from '$lib/hooks/activeElement/active-element-context.svelte';
	import LockSquareRoundedFilled from '@tabler/icons-svelte/icons/lock-square-rounded-filled';
	import { page } from '$app/state';
	import { trpc } from '$lib/trpc/client';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import ItemOptions from '../datalists/item-options.svelte';
	import { cn } from '$lib/utils';
	import { untrack } from 'svelte';

	const ctx = getExpenseFormContext();
	const { form, ai } = ctx;
	const { form: formData } = form;

	const api = trpc(page);

	const membersQuery = $derived(
		api.group.getMembers.createQuery(
			{ groupId: $formData.groupId },
			{
				refetchInterval: Infinity,
				enabled: uuidSchema.safeParse($formData.groupId).success
			}
		)
	);

	// Component ID for unique input IDs
	const id = $props.id();

	// Use $derived.by for computed values that depend on reactive state
	const total = $derived($formData.items.length);
	const filled = $derived($formData.items.filter((item) => item.amountExpression !== '').length);
	const unfilled = $derived(total - filled);
	const remaining = $derived.by(() => {
		const remainingAmount = (ctx.payers.total - ctx.items.total) / unfilled;
		return isNaN(remainingAmount) || !isFinite(remainingAmount)
			? '0'
			: remainingAmount.toFixed(ctx.currency.digits);
	});

	// Auto-add empty item row - use immutable updates
	$effect(() => {
		if (untrack(() => filled === total || total === 0)) {
			formData.update((current) => {
				return {
					...current,
					items: [
						...current.items,
						{
							id: generateId(),
							name: '',
							amountExpression: ''
						}
					]
				};
			});
		}
	});

	// Active element tracking for calculator
	const activeElement = useActiveElement();
	const calculatorOpen = $derived.by(() => {
		const current = activeElement.current;
		return current?.id.startsWith(`item-amt-${id}-`) || false;
	});

	// Deselect when focused on something outside of the items
	$effect(() => {
		if (activeElement.current?.id) {
			if (
				!(
					activeElement.current.id.startsWith(`item-select-${id}-`) ||
					activeElement.current.id.startsWith(`item-name-${id}-`) ||
					activeElement.current.id.startsWith(`item-amt-${id}-`)
				)
			) {
				ctx.items.selected.clear();
			}
		}
	});

	const openItemOptions = $derived(ctx.items.selected.size > 0 && !calculatorOpen);
</script>

<Form.Field {form} name="items">
	<Form.Control>
		{#snippet children({ props })}
			{@const { data: members, isLoading, isSuccess, error } = $membersQuery}

			<Form.Label>Items</Form.Label>

			{#if isLoading}
				<Skeleton class="h-9 w-full" />
			{:else if isSuccess}
				<div class={cn(ai.aiPendingFields.has('items') && 'ai-pending')}>
					<CheckboxGroup groupId="items-group">
						<section
							class="grid grid-cols-[auto_auto_1fr] items-center gap-2 overflow-x-auto rounded-md px-3 py-2 outline outline-border"
						>
							{#each $formData.items as item (item.id)}
								{@const idx = $formData.items.findIndex((i) => i.id === item.id)}
								{@const hasSplit = $formData.splits.some((s) => s.itemIds.includes(item.id))}
								<div>
									{#if hasSplit}
										<LockSquareRoundedFilled
											onclick={(e) => {
												e.preventDefault();
												// Remove item from split - use immutable update
												formData.update((current) => {
													return {
														...current,
														splits: current.splits.map((split) => ({
															...split,
															itemIds: split.itemIds.filter((id) => id !== item.id)
														}))
													};
												});
											}}
										/>
									{:else}
										<CheckboxButton
											id={`item-select-${id}-${item.id}`}
											tabindex={2}
											checked={ctx.items.selected.has(item.id)}
											onCheckedChange={(checked) => {
												if (checked) {
													ctx.items.selected.add(item.id);
												} else {
													ctx.items.selected.delete(item.id);
												}
											}}
										/>
									{/if}
								</div>

								<div>
									<Input
										id={`item-name-${id}-${item.id}`}
										type="text"
										oninput={() => ai.markFieldAsTouched('items')}
										bind:value={$formData.items[idx].name}
										placeholder={`#${item.id}`}
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
										id={`item-amt-${id}-${item.id}`}
										type="text"
										placeholder={remaining}
										variant="underlined"
										class="field-sizing-content max-w-30 min-w-9 truncate text-center"
										autocomplete="off"
										inputmode="numeric"
										data-scroll-into-view="true"
										bind:value={$formData.items[idx].amountExpression}
										tabindex={4}
									/>
								</label>
							{/each}
						</section>
					</CheckboxGroup>
				</div>
			{:else if error}
				<div class="text-center text-destructive">Error loading members</div>
			{/if}
			<Form.Description>
				{#if total > 0}
					{filled} / {total} Filled item{total === 1 ? '' : 's'}
				{:else}
					Add items and assign value
				{/if}
			</Form.Description>
		{/snippet}
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>

<ItemOptions open={openItemOptions} id="items" />
<Calculator open={calculatorOpen} id="items" />
