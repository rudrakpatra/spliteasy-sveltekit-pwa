<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { page } from '$app/state';
	import { trpc } from '$lib/trpc/client';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import { Badge } from '$lib/components/ui/badge';
	import X from '@lucide/svelte/icons/x';
	import Calculator from '../datalists/calculator.svelte';
	import { useActiveElement } from '$lib/hooks/activeElement/active-element-context.svelte';
	import EmblaScrollArea from '$lib/components/ui/embla-scroll-area/embla-scroll-area.svelte';
	import { cn } from '$lib/utils';
	import { evaluateAmountExpression } from '$lib/shared/schema/math';
	import CheckboxGroup from '../checkbox-group.svelte';
	import CheckboxButton from '../checkbox-button.svelte';

	const cid = $props.id();

	const ctx = getExpenseFormContext();
	const api = trpc(page);

	// Update splits when items change
	$effect(() => {
		const splits = ctx.splits;
		for (const [sid, split] of splits) {
			//remove item ids which dont exists
			split.itemIds.forEach((itemId) => {
				if (!ctx.items.has(itemId)) {
					split.itemIds.delete(itemId);
				}
			});
			//if split has no items, remove it
			if (split.itemIds.size === 0) {
				ctx.splits.delete(sid);
			}
		}
	});
	const activeElement = useActiveElement();

	const calculatorOpen = $derived.by(() => {
		const current = activeElement.current;
		// Match id={`${cid}.split.${splitId}.share.${user.id}`} using regex
		return current?.id.match(new RegExp(`^${cid}\\.split\\..+\\.share\\..+$`)) !== null || false;
	});
</script>

<div class="space-y-2">
	<Label>Splits</Label>
	<div class="space-y-2">
		{#if ctx.splits.size === 0}
			<div class={cn(ctx.ai.pendingFields.has('splits') && 'ai-pending')}>
				<section class="space-y-2 rounded-md outline outline-border">
					<div class="px-3 py-2 text-muted-foreground">No Splits Created</div>
				</section>
			</div>
		{:else}
			{#each ctx.splits as [splitId, split] (splitId)}
				{@const shareCount = Array.from(split.shares.values()).reduce((sum, s) => {
					const val = evaluateAmountExpression(s) || 0;
					return sum + val;
				}, 0)}
				<div class={cn(ctx.ai.pendingFields.has('splits') && 'ai-pending')}>
					<section class="space-y-2 rounded-md outline outline-border">
						<Label class="px-3 py-2 pb-0">
							<EmblaScrollArea class="w-full" containerClass="gap-2">
								{#each split.itemIds as itemId (itemId)}
									<Badge
										class="pr-1"
										type="button"
										onclick={() => {
											// Remove item from the split - immutable update
											ctx.splits.get(splitId)!.itemIds.delete(itemId);
										}}
										variant="outline"
									>
										<span class="max-w-[16ch] justify-start truncate">
											{ctx.items.get(itemId)?.name || `#${itemId}`}
										</span>
										<X />
									</Badge>
								{/each}
							</EmblaScrollArea>
						</Label>
						<CheckboxGroup groupId="split-group">
							<div class="group grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2">
								{#each ctx.participants as [id, participant]}
									{@const shareValue = split.shares.get(id)}

									<label
										class="flex items-center gap-2"
										for={`${cid}.split.${splitId}.share.${id}`}
									>
										<Avatar.Root class="size-9 shrink-0">
											<Avatar.Fallback>
												{(participant.name || id).slice(0, 1).toUpperCase()}
											</Avatar.Fallback>
										</Avatar.Root>
										{#if participant.name}
											<span class="flex-1 font-medium">{participant.name}</span>
										{:else}
											<span class="flex-1 font-medium text-muted-foreground">@{id}</span>
										{/if}
									</label>
									<Input
										id={`${cid}.split.${splitId}.share.${id}`}
										type="text"
										placeholder={'0'}
										value={shareValue}
										oninput={(e) => {
											ctx.splits.get(splitId)!.shares.set(id, e.currentTarget.value);
										}}
										data-scroll-into-view="true"
										inputmode="numeric"
										variant="underlined"
										class="field-sizing-content min-w-9 text-center"
										autocomplete="off"
									/>
									<CheckboxButton
										id={`${cid}.split.${splitId}.share.${id}`}
										tabindex={2}
										checked={!!shareValue}
										onCheckedChange={(checked) => {
											ctx.splits.get(splitId)!.shares.set(id, checked ? '1' : '');
										}}
									/>
								{/each}
							</div>
						</CheckboxGroup>
						<div class="px-3 pb-2">
							<p class="text-xs text-muted-foreground">
								{shareCount ? `${shareCount} Total shares` : 'Please check the share expressions'}
							</p>
						</div>
					</section>
				</div>
			{/each}
		{/if}
	</div>
	<p class="text-xs text-muted-foreground">
		{#if ctx.splits.size > 0}
			{ctx.splits.size} Total splits
		{:else}
			Select items and split them by shares
		{/if}
	</p>
</div>
<Calculator open={calculatorOpen} id={cid} />
