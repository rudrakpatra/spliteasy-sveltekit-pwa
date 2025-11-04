<script lang="ts">
	import { getExpenseFormContext } from './context.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Avatar from '$lib/components/ui/avatar';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { uuidSchema } from '$lib/shared/schema/uuid';

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

	const { data, isPending, isSuccess } = $derived($membersQuery);
</script>

<div class="space-y-2">
	{#if ctx.parsed.error}
		{#each JSON.parse(ctx.parsed.error.message) as error}
			<p class="text-xs text-destructive">• {error.message}</p>
		{/each}
	{/if}

	{#if ctx.parsed.success}
		<Label>Review</Label>
		<section
			class="group grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md px-3 py-2 outline outline-border"
		>
			{#each ctx.parsed.data.splits as split}
				{@const user = $membersQuery.data?.find((user) => user.user_id === split.user_id)?.user}
				{#if user}
					<div class="flex flex-1 items-center gap-2 whitespace-nowrap">
						<Avatar.Root class="flex size-9 shrink-0 items-center">
							<Avatar.Fallback>
								{user.name.slice(0, 1).toUpperCase()}
							</Avatar.Fallback>
						</Avatar.Root>
						<span class="flex-1 font-medium">{user.name}</span>
					</div>
					<span class="text-right">
						{split.owes_amount}
					</span>
					<span class="text-right">
						{split.paid_amount}
					</span>
				{/if}
			{/each}
		</section>
	{/if}
</div>
