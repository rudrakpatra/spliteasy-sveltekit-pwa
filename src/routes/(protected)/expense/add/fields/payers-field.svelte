<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import { useActiveElement } from '$lib/hooks/activeElement/active-element-context.svelte';
	import Calculator from '../datalists/calculator.svelte';

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

	const activeElement = useActiveElement();

	const calculatorOpen = $derived(activeElement?.current?.id.startsWith('paid-amt-') || false);
</script>

<Form.Field {form} name="payers">
	<Form.Control>
		{#snippet children({ props })}
			{@const { data, isLoading, isSuccess } = $membersQuery}
			<Form.Label>Paid by</Form.Label>
			{#if isLoading}
				<Skeleton class="h-9 w-full" />
			{:else if isSuccess}
				<section
					class="group grid grid-cols-[1fr_auto] items-center gap-2 rounded-md px-3 py-2 outline outline-border"
				>
					{#each data as { user }}
						{@const payerIndex = $formData.payers.findIndex((p) => p.userId === user.id)}
						{@const payerAmount =
							payerIndex >= 0 ? $formData.payers[payerIndex].amountExpression : ''}

						<label
							class="flex flex-1 items-center gap-2 whitespace-nowrap"
							for={`paid-amt-${user.id}`}
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
							id={`paid-amt-${user.id}`}
							type="text"
							placeholder={(0).toFixed(ctx.currency.digits)}
							value={payerAmount}
							oninput={(e) => {
								const value = e.currentTarget.value;
								formData.update((current) => {
									const existingPayerIndex = current.payers.findIndex((p) => p.userId === user.id);

									if (existingPayerIndex >= 0) {
										if (value) {
											// Update existing payer
											current.payers = current.payers.map((payer, idx) =>
												idx === existingPayerIndex ? { ...payer, amountExpression: value } : payer
											);
										} else {
											// Remove payer if empty
											current.payers = current.payers.filter((p) => p.userId !== user.id);
										}
									} else if (value) {
										// Add new payer
										current.payers = [
											...current.payers,
											{ userId: user.id, amountExpression: value }
										];
									}

									return current;
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
			{/if}
		{/snippet}
	</Form.Control>
	<Form.Description>Choose who paid for this expense</Form.Description>
	<Form.FieldErrors />
</Form.Field>

<Calculator open={calculatorOpen} id="payers" />
