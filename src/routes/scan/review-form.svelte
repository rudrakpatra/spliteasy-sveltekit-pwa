<script lang="ts">
	import { getExpenseFormContext } from './context.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { evaluateAmountExpression } from '$lib/shared/schema/math';

	const ctx = getExpenseFormContext();
</script>

<div class="space-y-2">
	{#if ctx.parsed.error}
		{#each JSON.parse(ctx.parsed.error.message) as error}
			<p class="text-xs text-destructive">
				• {error.message}
			</p>
		{/each}
	{/if}

	{#if ctx.parsed.success}
		{@const splits = ctx.parsed.data.splits}
		<Label>Review</Label>
		<section
			class="group grid grid-cols-[1fr] items-center gap-2 rounded-md px-3 py-2 outline outline-border"
		>
			{#each ctx.participants as [id, participant]}
				{@const owes = splits.find((s) => s.user_id === id)?.owes_amount}
				{@const paid = splits.find((s) => s.user_id === id)?.paid_amount}
				{#if Number(owes) || Number(paid)}
					<div>
						<div class="flex flex-1 items-center gap-2 whitespace-nowrap">
							<Avatar.Root class="size-9 shrink-0">
								<Avatar.Fallback>
									{(participant.name || id).slice(0, 1).toUpperCase()}
								</Avatar.Fallback>
							</Avatar.Root>
							<span class="flex-1 font-medium">{participant.name || '@' + id}</span>
							<div class="flex items-center gap-2">
								<span class="text-xs text-muted-foreground">Owes {owes}</span>
								<span class="text-xs text-muted-foreground">Paid {paid}</span>
							</div>
						</div>
						<Label class="my-4 flex flex-wrap gap-2">
							{#each ctx.splits as [splitId, split], i}
								{@const total = Array.from(split.shares.values()).reduce((acc, curr) => {
									return acc + (evaluateAmountExpression(curr) || 0);
								}, 0)}
								{#each split.shares as [userId, share] (userId)}
									{@const own = evaluateAmountExpression(share) || 0}
									{#if userId === id}
										<div class="whitespace-nowrap">
											<Badge class="pr-1" type="button" variant="outline">
												<span class="justify-start truncate">
													{#each split.itemIds as itemId, j (itemId)}
														{ctx.items.get(itemId)?.name || `#${itemId}`}
														{#if j != split.itemIds.size - 1}
															<b>+</b>&nbsp;
														{/if}
													{/each}
												</span>
											</Badge>
											<span>*</span>
											<math xmlns="http://www.w3.org/1998/Math/MathML">
												<mfrac>
													<mn>{own}</mn>
													<mn>{total}</mn>
												</mfrac>
											</math>
										</div>
									{/if}
								{/each}
							{/each}
						</Label>
					</div>
				{/if}
			{/each}
		</section>
	{/if}
</div>
