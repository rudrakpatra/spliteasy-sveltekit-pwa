<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import { useActiveElement } from '$lib/hooks/activeElement/active-element-context.svelte';
	import Calculator from '../datalists/calculator.svelte';

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

	const activeElement = useActiveElement();

	const calculatorOpen = $derived.by(() => {
		const current = activeElement.current;
		// Match id={`${cid}.payer.${user.id}`} using regex
		return current?.id.match(new RegExp(`^${cid}\\.payer\\..+$`)) !== null || false;
	});
	const { data, isPending, isSuccess } = $derived($membersQuery);
</script>

<div class="space-y-2">
	{#if isPending}
		<Skeleton class="h-4 w-20" />
		<Skeleton class="h-12 w-full" />
		<Skeleton class="h-4 w-1/3" />
	{:else if isSuccess}
		<Label>Paid by</Label>
		<section
			class="group grid grid-cols-[1fr_auto] items-center gap-2 rounded-md px-3 py-2 outline outline-border"
		>
			{#each data as { user }}
				<label
					class="flex flex-1 items-center gap-2 whitespace-nowrap"
					for={`${cid}.payer.${user.id}`}
				>
					<Avatar.Root class="flex size-9 shrink-0 items-center">
						<Avatar.Image src={user.img} alt={user.name} />
						<Avatar.Fallback>
							{user.name.slice(0, 1).toUpperCase()}
						</Avatar.Fallback>
					</Avatar.Root>
					<span class="flex-1 font-medium">{user.name}</span>
				</label>

				<Input
					id={`${cid}.payer.${user.id}`}
					type="text"
					placeholder={(0).toFixed(ctx.currency.digits)}
					value={ctx.payers.get(user.id)?.amount || ''}
					oninput={(e) => {
						//convert to number
						ctx.payers.set(user.id, {
							amount: e.currentTarget.value
						});
					}}
					variant="underlined"
					class="field-sizing-content max-w-30 min-w-9 text-center"
					autocomplete="off"
					inputmode="numeric"
					data-scroll-into-view="true"
				/>
			{/each}
		</section>
		<p class="text-xs text-muted-foreground">Choose who paid for this expense</p>
	{/if}
</div>

<Calculator open={calculatorOpen} id={cid} />
