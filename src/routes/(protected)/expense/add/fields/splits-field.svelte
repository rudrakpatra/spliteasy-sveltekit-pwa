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

	const cid = $props.id();

	const ctx = getExpenseFormContext();
	const api = trpc(page);

	const membersQuery = $derived(
		api.group.getMembers.createQuery(
			{ groupId: ctx.groupId.current },
			{
				refetchInterval: Infinity,
				enabled: uuidSchema.safeParse(ctx.groupId.current).success
			}
		)
	);

	// Update splits when items change
	$effect(() => {
		const splits = ctx.splits;
		for (const [sid, split] of splits) {
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
	const { data: members, isLoading, isSuccess, error } = $derived($membersQuery);
</script>

<div class="space-y-2">
	<Label>Splits</Label>
	{#if isLoading}
		<Skeleton class="h-9 w-full" />
	{:else if isSuccess}
		<div class="space-y-2">
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
						<div class="group grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2">
							{#each members as { user }}
								{@const shareValue = split.shares.get(user.id)}

								<label
									class="flex items-center gap-2"
									for={`${cid}.split.${splitId}.share.${user.id}`}
								>
									<Avatar.Root class="size-9 shrink-0">
										<Avatar.Image src={user.img} alt={user.name} />
										<Avatar.Fallback>
											{user.name.slice(0, 1).toUpperCase()}
										</Avatar.Fallback>
									</Avatar.Root>
									<span class="flex-1 font-medium">{user.name}</span>
								</label>
								<Input
									id={`${cid}.split.${splitId}.share.${user.id}`}
									type="text"
									placeholder={'0'}
									value={shareValue}
									oninput={(e) => {
										ctx.splits.get(splitId)!.shares.set(user.id, e.currentTarget.value);
									}}
									onpointerdown={(e) => {
										if (shareValue === ' ' || !shareValue) {
											e.preventDefault();
										}
									}}
									onfocus={(e) => {
										if (shareValue === ' ' || !shareValue) {
											ctx.splits.get(splitId)!.shares.set(user.id, '1');
											//prevent focus from happening
											e.preventDefault();
											e.stopPropagation();
										} else {
											e.currentTarget.select();
										}
									}}
									data-scroll-into-view={shareValue ? 'true' : 'false'}
									inputmode={shareValue ? 'numeric' : 'none'}
									variant="underlined"
									class="field-sizing-content min-w-9 text-center"
									autocomplete="off"
								/>
							{/each}
						</div>
						<div class="px-3 pb-2">
							<p class="text-xs text-muted-foreground">
								{shareCount ? `${shareCount} Total shares` : 'Please check the share expressions'}
							</p>
						</div>
					</section>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="text-destructive">Error loading members</div>
	{/if}
	<p class="text-xs text-muted-foreground">
		{#if ctx.splits.size > 0}
			{ctx.splits.size} Total splits
		{:else}
			Select items and split them by shares
		{/if}
	</p>
</div>
<Calculator open={calculatorOpen} id={cid} />
