<!-- routes/expense/create/components/payers-field.svelte -->
<script lang="ts">
	import type { z } from 'zod';
	import type { createExpenseSchema } from '$lib/shared/schema/expense';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import * as Form from '$lib/components/ui/form';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Command from '$lib/components/ui/command';
	import { Command as CommandPrimitive } from 'bits-ui';
	import { VisualViewportView } from '$lib/components/ui/visual-viewport-view';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';
	import X from '@tabler/icons-svelte/icons/x';
	import Cube from '@tabler/icons-svelte/icons/cube';

	let {
		form,
		formData = $bindable(),
		groupId,
		isPending
	}: {
		form: any;
		formData: z.infer<typeof createExpenseSchema>;
		groupId: string;
		isPending: boolean;
	} = $props();

	const api = trpc(page);

	const membersQuery = $derived(
		api.group.getMembers.createQuery(
			{ groupId },
			{ enabled: uuidSchema.safeParse(groupId).success }
		)
	);

	let currencyPrefix = $state('$');
	let currencySuffix = $state('');
	let cmdValue = $state('');
	let isAddInputFocused = $state(false);
</script>

{#if $membersQuery.isSuccess}
	<Form.Field {form} name="payers">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Who paid?</Form.Label>

				{#each formData.payers as payer, index (payer.userId)}
					{@const member = $membersQuery.data.find((m) => m.userId === payer.userId)}
					{#if member}
						<InputGroup.Root>
							<InputGroup.Addon align="block-start">
								<Avatar.Root class="size-6 flex-shrink-0">
									<Avatar.Image src={member.user.img} />
									<Avatar.Fallback>{member.user.name[0]}</Avatar.Fallback>
								</Avatar.Root>
								<InputGroup.Text class="flex-1"><b>{member.user.name}</b> paid</InputGroup.Text>
								<InputGroup.Button
									size="icon-xs"
									onclick={() => {
										formData.payers = formData.payers.filter((p) => p.userId !== payer.userId);
									}}
								>
									<X />
								</InputGroup.Button>
							</InputGroup.Addon>
							<InputGroup.Input
								id={`payer-${payer.userId}-amount`}
								value={payer.amount}
								oninput={(e) => {
									formData.payers[index].amount = e.currentTarget.value as `${number}`;
								}}
								placeholder="Paid Amount"
								disabled={isPending}
								class="text-left"
								inputmode="numeric"
								autocomplete="off"
							/>
						</InputGroup.Root>
					{/if}
				{/each}

				{#each formData.items as item, index (item.name)}
					<InputGroup.Root>
						<InputGroup.Addon align="block-start">
							<Cube class="size-6 flex-shrink-0" />
							<InputGroup.Text class="flex-1"><b>{item.name}</b> for</InputGroup.Text>
							<InputGroup.Button
								size="icon-xs"
								onclick={() => {
									formData.items = formData.items.filter((i) => i.name !== item.name);
								}}
							>
								<X />
							</InputGroup.Button>
						</InputGroup.Addon>
						<InputGroup.Input
							id={`item-${item.name}-amount`}
							value={item.amountExpression}
							oninput={(e) => {
								formData.items[index].amountExpression = e.currentTarget.value as `${number}`;
							}}
							placeholder="Item Amount"
							disabled={isPending}
							class="currency-input text-left"
							inputmode="numeric"
							autocomplete="off"
							data-currency-prefix={currencyPrefix}
							data-currency-suffix={currencySuffix}
						/>
					</InputGroup.Root>
				{/each}

				<Command.Root class="bg-transparent">
					<CommandPrimitive.Input
						data-slot="command-input"
						class={cn(
							'flex h-10 w-full rounded-md bg-transparent p-3 outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
						)}
						bind:value={cmdValue}
						placeholder="Add Payer or Item..."
						onfocus={() => (isAddInputFocused = true)}
						onblur={() => (isAddInputFocused = false)}
					/>
					<VisualViewportView forceOverlaysContent>
						{#if isAddInputFocused}
							<div transition:slide={{ axis: 'y' }}>
								<Command.List
									class="absolute inset-0 top-auto overflow-auto border-t border-border bg-background px-3 py-1 text-foreground"
								>
									<Command.Group
										class="flex flex-row gap-2 [&_[data-command-group-items]]:flex [&_[data-command-group-items]]:flex-row [&_[data-command-group-items]]:gap-2"
									>
										{#each $membersQuery.data as member}
											{#if !formData.payers.some((p) => p.userId === member.userId)}
												<Command.Item
													value={member.user.name}
													onpointerdown={(e) => {
														e.preventDefault();
													}}
													onSelect={async () => {
														const newPayer = { userId: member.userId, amount: '' as `${number}` };
														formData.payers = [...formData.payers, newPayer];
														cmdValue = '';
														isAddInputFocused = false;

														// Focus the newly created input
														await tick();
														document.getElementById(`payer-${member.userId}-amount`)?.focus();
													}}
												>
													<b>@{member.user.name}</b>
												</Command.Item>
											{/if}
										{/each}
										{#if cmdValue}
											<Command.Item
												value={cmdValue}
												onpointerdown={(e) => {
													e.preventDefault();
												}}
												onSelect={async () => {
													const itemName = cmdValue;
													formData.items = [
														...formData.items,
														{ name: itemName, amountExpression: '' as `${number}`, split: [] }
													];
													cmdValue = '';
													isAddInputFocused = false;

													// Focus the newly created input
													await tick();
													document.getElementById(`item-${itemName}-amount`)?.focus();
												}}
											>
												<b>#{cmdValue}</b>
											</Command.Item>
										{/if}
									</Command.Group>
								</Command.List>
							</div>
						{/if}
					</VisualViewportView>
				</Command.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/if}

<style>
	:global(.currency-input[data-currency-prefix]:before) {
		content: attr(data-currency-prefix);
	}
	:global(.currency-input[data-currency-suffix]:after) {
		content: attr(data-currency-suffix);
	}
</style>
