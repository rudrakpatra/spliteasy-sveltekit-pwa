<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { page } from '$app/state';
	import { trpc } from '$lib/trpc/client';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import { Badge } from '$lib/components/ui/badge';
	import X from '@lucide/svelte/icons/x';
	import type { UserId } from '$lib/shared/schema/user';
	import Calculator from '../datalists/calculator.svelte';
	import { useActiveElement } from '$lib/hooks/activeElement/active-element-context.svelte';
	import EmblaScrollArea from '$lib/components/ui/embla-scroll-area/embla-scroll-area.svelte';
	import { untrack } from 'svelte';

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

	$effect(() => {
		//check if the items exists
		const items = untrack(() => $formData.items);
		//for each split delete item id that doesn't exist in items and delete the split if all items are deleted
		formData.update((current) => {
			return {
				...current,
				splits: current.splits
					.map((split) => {
						const newSplits = split.itemIds.filter((id) => items.some((item) => item.id === id));
						console.log(newSplits);
						if (newSplits.length === 0) {
							return null;
						}
						return {
							...split,
							itemIds: newSplits
						};
					})
					.filter((split) => split !== null)
			};
		});
	});

	const handleShareChange = (splitId: string, userId: UserId, value: string) => {
		formData.update((current) => {
			const splitIndex = current.splits.findIndex((s) => s.id === splitId);
			const currentSplit = current.splits[splitIndex];
			const existingShareIndex = currentSplit.shares.findIndex((s) => s.userId === userId);

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
					userId,
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
	};

	const activeElement = useActiveElement();

	const calculatorOpen = $derived.by(() => {
		const current = activeElement.current;
		return current?.id.startsWith(`split-`) || false;
	});
</script>

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
						<section class="space-y-2 rounded-md outline outline-border">
							<Form.Label class="px-3 py-2 pb-0">
								<EmblaScrollArea class="w-full" containerClass="gap-2">
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
											<span class="max-w-[16ch] justify-start truncate">
												{item.name || `#${item.id}`}
											</span>
											<X />
										</Badge>
									{/each}
								</EmblaScrollArea>
							</Form.Label>
							<div class="group grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2">
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
											handleShareChange(split.id, user.id, e.currentTarget.value);
										}}
										onpointerdown={(e) => {
											if (shareValue === '') {
												e.preventDefault();
											}
										}}
										onclick={(e) => {
											if (shareValue === '') {
												handleShareChange(split.id, user.id, '1');
												e.preventDefault();
												e.stopPropagation();
												//prevent focus from happening
											}
										}}
										onfocus={(e) => e.currentTarget.select()}
										data-scroll-into-view={shareValue ? 'true' : 'false'}
										inputmode={shareValue ? 'numeric' : 'none'}
										variant="underlined"
										class="field-sizing-content min-w-9 text-center"
										autocomplete="off"
									/>
								{/each}
							</div>
							<Form.Description class="px-3 pb-2">
								{split.shares.reduce((sum, s) => {
									const val = parseFloat(s.shareExpression) || 0;
									return sum + val;
								}, 0)} Total shares
							</Form.Description>
						</section>
					{/each}
				</div>

				<Form.Description>
					{#if $formData.splits.length > 0}
						{$formData.splits.length} Total splits
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

<Calculator open={calculatorOpen} id="splits" />
