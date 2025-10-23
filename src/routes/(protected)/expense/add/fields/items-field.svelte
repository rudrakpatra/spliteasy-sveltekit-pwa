<script lang="ts">
	import { generateId, getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import CheckboxButton from '../checkbox-button.svelte';
	import CheckboxGroup from '../checkbox-group.svelte';
	import Calculator from '../datalists/calculator.svelte';
	import { useActiveElement } from '$lib/hooks/use-active-element.svelte';
	import LockSquareRoundedFilled from '@tabler/icons-svelte/icons/lock-square-rounded-filled';
	import { page } from '$app/state';
	import { trpc } from '$lib/trpc/client';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import ItemOptions from '../datalists/item-options.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import X from '@lucide/svelte/icons/x';
	import { CURRENCY_MAP } from '$lib/shared/currency/currency-codes';

	const ctx = getExpenseFormContext();
	const { form } = ctx;
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
	const digits = $derived(CURRENCY_MAP.get($formData.currency)?.digits ?? 2);
	const remaining = $derived.by(() => {
		const remainingAmount = (ctx.payers.total - ctx.items.total) / unfilled;
		return isNaN(remainingAmount) || !isFinite(remainingAmount)
			? '0'
			: remainingAmount.toFixed(digits);
	});

	// Auto-add empty item row - use immutable updates
	$effect(() => {
		if (filled === total || total === 0) {
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

	$effect.pre(() => {
		const currentSplits = $formData.splits;
		const hasEmptySplits = currentSplits.some((split) => split.itemIds.length === 0);

		if (hasEmptySplits) {
			formData.update((current) => ({
				...current,
				splits: current.splits.filter((split) => split.itemIds.length > 0)
			}));
		}
	});

	// Active element tracking for calculator
	const activeElement = useActiveElement();
	const calculatorOpen = $derived.by(() => {
		const current = activeElement.current;
		return current?.id.startsWith(`item-amt-${id}-`) || current?.id.startsWith(`split-`) || false;
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
				<CheckboxGroup groupId="items-group">
					<section class="grid grid-cols-[auto_auto_1fr] items-center gap-2 overflow-x-auto p-2">
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
										tabindex={2}
										checked={ctx.items.selected.has(item.id)}
										onCheckedChange={(checked) => {
											if (checked) {
												ctx.items.selected.add(item.id);
											} else {
												ctx.items.selected.delete(item.id);
											}
										}}
										id={`item-select-${id}-${item.id}`}
									/>
								{/if}
							</div>

							<div>
								<Input
									id={`item-name-${id}-${item.id}`}
									type="text"
									bind:value={$formData.items[idx].name}
									placeholder={`#${item.id}`}
									variant="underlined"
									class="field-sizing-content max-w-30 min-w-9 truncate text-left"
									autocomplete="off"
									inputmode="text"
									tabindex={3}
								/>
							</div>

							<div class="ml-auto">
								<Input
									id={`item-amt-${id}-${item.id}`}
									type="text"
									placeholder={remaining}
									variant="underlined"
									class="field-sizing-content max-w-[16ch] min-w-[8ch] truncate text-center"
									autocomplete="off"
									inputmode="numeric"
									bind:value={$formData.items[idx].amountExpression}
									tabindex={4}
								/>
							</div>
						{/each}
					</section>
				</CheckboxGroup>
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

<Form.Field {form} name="splits">
	<Form.Control>
		{#snippet children({ props })}
			{@const { data: members, isLoading, isSuccess, error } = $membersQuery}

			<Form.Label>Splits</Form.Label>

			{#if isLoading}
				<Skeleton class="h-9 w-full" />
			{:else if isSuccess}
				<div class="space-y-2">
					{#each $formData.splits as split (split.id)}
						{@const items = $formData.items.filter((i) => split.itemIds.includes(i.id))}
						<div class="space-y-2 rounded-md outline outline-border">
							<Form.Label class="overflow-x-auto p-2 pb-0">
								{#each items as item}
									<Badge
										class="pr-1"
										type="button"
										onclick={() => {
											formData.update((current) => {
												// Remove item from the split - immutable update
												return {
													...current,
													splits: current.splits.map((s) =>
														s.id === split.id
															? {
																	...s,
																	itemIds: s.itemIds.filter((i) => i !== item.id)
																}
															: s
													)
												};
											});
										}}
										variant="outline"
									>
										<span class="max-w-[16ch] min-w-[8ch] justify-start truncate">
											{item.name || `#${item.id}`}
										</span>
										<X />
									</Badge>
								{/each}
							</Form.Label>
							<div class="group grid grid-cols-[1fr_auto] items-center gap-2 p-2">
								{#each members as { user }}
									{@const shareIndex = split.shares.findIndex((s) => s.userId === user.id)}
									{@const shareValue =
										shareIndex >= 0 ? split.shares[shareIndex].shareExpression : ''}

									<label class="flex items-center gap-2" for={`split-${split.id}-share-${user.id}`}>
										<Avatar.Root class="size-9 flex-shrink-0">
											<Avatar.Image src={user.img} alt={user.name} />
											<Avatar.Fallback>
												{user.name.slice(0, 1).toUpperCase()}
											</Avatar.Fallback>
										</Avatar.Root>
										<span class="flex-1 font-medium">{user.name}</span>
									</label>
									<Input
										id={`split-${split.id}-share-${user.id}`}
										type="text"
										placeholder={'0'}
										value={shareValue}
										oninput={(e) => {
											formData.update((current) => {
												const value = e.currentTarget.value;
												const splitIndex = current.splits.findIndex((s) => s.id === split.id);
												const currentSplit = current.splits[splitIndex];
												const existingShareIndex = currentSplit.shares.findIndex(
													(s) => s.userId === user.id
												);

												// Create new splits array with immutable updates
												const newSplits = [...current.splits];
												const newShares = [...currentSplit.shares];

												if (existingShareIndex >= 0) {
													if (value) {
														newShares[existingShareIndex] = {
															...newShares[existingShareIndex],
															shareExpression: value
														};
													} else {
														newShares.splice(existingShareIndex, 1);
													}
												} else if (value) {
													newShares.push({
														userId: user.id,
														shareExpression: value
													});
												}

												newSplits[splitIndex] = {
													...currentSplit,
													shares: newShares
												};

												return {
													...current,
													splits: newSplits
												};
											});
										}}
										variant="underlined"
										class="field-sizing-content min-w-9 text-center"
										autocomplete="off"
										inputmode="numeric"
									/>
								{/each}
							</div>
							<Form.Description class="px-2 pb-2">
								{split.shares.reduce((sum, s) => {
									const val = parseFloat(s.shareExpression) || 0;
									return sum + val;
								}, 0)} Total shares
							</Form.Description>
						</div>
					{/each}
				</div>

				<Form.Description>
					{#if $formData.splits.length > 0}
						{$formData.splits.length} Total split{$formData.splits.length === 1 ? '' : 's'}
					{:else}
						Select items and split them by shares
					{/if}
				</Form.Description>
			{:else if error}
				<div class="text-destructive">Error loading members</div>
			{/if}
		{/snippet}
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>

<ItemOptions open={openItemOptions} id="items" />
<Calculator open={calculatorOpen} id="items" />
