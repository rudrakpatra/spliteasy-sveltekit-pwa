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

	// Track filled items (for auto-adding empty row)
	const filledCount = $derived.by(() => {
		return $formData.items.filter((item) => item.amountExpression !== '').length;
	});

	// Auto-add empty item row
	$effect(() => {
		const total = $formData.items.length;

		if (filledCount === total || total === 0) {
			$formData.items.push({
				id: generateId(),
				name: '',
				amountExpression: ''
			});
		}
	});

	// Active element tracking for calculator
	const activeElement = useActiveElement();
	const calculatorOpen = $derived(
		activeElement.current?.id.startsWith(`item-amt-${id}-`) ||
			activeElement.current?.id.startsWith(`split-`) ||
			false
	);

	let openItemOptions = $derived(ctx.items.selected.size > 0 && !calculatorOpen);
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

							{#if hasSplit}
								<LockSquareRoundedFilled />
							{:else}
								<CheckboxButton
									tabindex={-1}
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

							<div>
								<Input
									id={`item-name-${id}-${item.id}`}
									type="text"
									value={item.name}
									oninput={(e) => {
										if (idx >= 0) {
											$formData.items[idx].name = e.currentTarget.value;
										}
									}}
									tabindex={-1}
									placeholder={`#${item.id}`}
									variant="underlined"
									class="field-sizing-content min-w-9 text-left"
									autocomplete="off"
									inputmode="text"
								/>
							</div>

							<div class="ml-auto">
								<Input
									id={`item-amt-${id}-${item.id}`}
									type="text"
									placeholder="0"
									variant="underlined"
									class="field-sizing-content min-w-9 text-center"
									autocomplete="off"
									inputmode="numeric"
									value={item.amountExpression}
									oninput={(e) => {
										if (idx >= 0) {
											$formData.items[idx].amountExpression = e.currentTarget.value;
										}
									}}
								/>
							</div>
						{/each}
					</section>
				</CheckboxGroup>
			{:else if error}
				<div class="text-center text-destructive">Error loading members</div>
			{/if}
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

						<Form.Label class="flex flex-wrap items-center gap-1">
							<span>Split</span>
							{#each items as item}
								<Badge
									onclick={() => {
										const itemIdx = $formData.splits.findIndex((s) => s.id === split.id);
										if (itemIdx >= 0) {
											$formData.splits[itemIdx].itemIds.splice(itemIdx, 1);
										}

										// Remove split if no items left
										if ($formData.splits[itemIdx].itemIds.length === 0) {
											$formData.splits.splice(itemIdx, 1);
										}
									}}
									variant="outline"
									class="pr-1"
								>
									{item.name || `#${item.id}`}
									<X />
								</Badge>
							{/each}
							<span>by shares</span>
						</Form.Label>

						{#each members as { user }}
							{@const shareIndex = split.shares.findIndex((s) => s.userId === user.id)}
							{@const shareValue = shareIndex >= 0 ? split.shares[shareIndex].shareExpression : ''}

							<div class="group grid grid-cols-[1fr_auto] items-center gap-2 p-2">
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
									placeholder="0"
									value={shareValue}
									oninput={(e) => {
										const value = e.currentTarget.value;
										const splitIndex = $formData.splits.findIndex((s) => s.id === split.id);
										const currentSplit = $formData.splits[splitIndex];
										const existingShareIndex = currentSplit.shares.findIndex(
											(s) => s.userId === user.id
										);

										if (existingShareIndex >= 0) {
											if (value) {
												currentSplit.shares[existingShareIndex].shareExpression = value;
											} else {
												currentSplit.shares.splice(existingShareIndex, 1);
											}
										} else if (value) {
											currentSplit.shares.push({
												userId: user.id,
												shareExpression: value
											});
										}
									}}
									variant="underlined"
									class="field-sizing-content min-w-9 text-center"
									autocomplete="off"
									inputmode="numeric"
								/>
							</div>
						{/each}
						<Form.Description class="px-2 pb-2">
							{split.shares.reduce((sum, s) => {
								const val = parseFloat(s.shareExpression) || 0;
								return sum + val;
							}, 0)} Total shares
						</Form.Description>
					{/each}
				</div>

				<Form.Description>
					{#if $formData.splits.length > 0}
						{$formData.splits.length} split{$formData.splits.length === 1 ? '' : 's'}
					{:else}
						Select items and split them by shares
					{/if}
				</Form.Description>
			{:else if error}
				<div class="text-center text-destructive">Error loading members</div>
			{/if}
		{/snippet}
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>

<ItemOptions open={openItemOptions} id="items" />
<Calculator open={calculatorOpen} id="items" />
