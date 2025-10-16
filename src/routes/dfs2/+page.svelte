<script lang="ts">
	import type { PageData } from './$types';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { createExpenseSchema, transformedCreateExpenseSchema } from '$lib/shared/schema/expense';
	import * as Drawer from '$lib/components/ui/drawer';
	import ChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import * as Command from '$lib/components/ui/command';
	import { Command as CommandPrimitive } from 'bits-ui';
	import * as Empty from '$lib/components/ui/empty';
	import UsersGroup from '@tabler/icons-svelte/icons/users-group';
	import { toast } from 'svelte-sonner';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { currencies } from '$lib/shared/currency/currency-codes';
	import Category from '@tabler/icons-svelte/icons/category';
	import { categories } from '$lib/shared/category/category';
	import CashBanknote from '@tabler/icons-svelte/icons/cash-banknote';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Avatar from '$lib/components/ui/avatar';
	import Receipt from '@tabler/icons-svelte/icons/receipt';
	import Scan from '@tabler/icons-svelte/icons/scan';
	import Upload from '@tabler/icons-svelte/icons/upload';
	import Ai from '@tabler/icons-svelte/icons/ai';
	import Sparkles from '@tabler/icons-svelte/icons/sparkles';
	import { Spinner } from '$lib/components/ui/spinner';
	import Checks from '@tabler/icons-svelte/icons/checks';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import { useCurrencySuggestions } from '$lib/hooks/use-currency-suggestions';
	import { uuidSchema } from '$lib/shared/schema/uuid';

	import { onMount } from 'svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { VisualViewportView } from '$lib/components/ui/visual-viewport-view';
	import { useActiveElement } from '$lib/hooks/use-active-element.svelte';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	// Setup tRPC
	const api = trpc(page, data.queryClient);
	const utils = api.createUtils();

	// Setup mutation
	const createExpense = api.expense.insert.createMutation({
		onSuccess: (expense) => {
			utils.expense.getProposed.invalidate();
			goto(`/expense/${expense.id}`);
		},
		onError: (error) => {
			toast.error('Failed to create expense', { description: error.message });
		}
	});

	// Setup Superforms with SPA mode (client-side only)
	const form = superForm(defaults(zod4(createExpenseSchema)), {
		SPA: true,
		validators: zod4(createExpenseSchema),
		resetForm: false,
		onUpdate({ form }) {
			// This runs when form is submitted and valid
			if (form.valid) {
				// Submit via tRPC mutation
				$createExpense.mutate(transformedCreateExpenseSchema.parse(form.data));
			}
		}
	});

	const { form: formData, enhance } = form;

	let drawers = $state({
		groups: false,
		currency: false,
		category: false
	});

	const groupsQuery = api.group.list.createQuery(
		{
			limit: 20,
			offset: 0
		},
		{
			refetchInterval: Infinity
		}
	);

	createExpense.subscribe((result) => {
		if (result.status === 'success') {
			goto(`/expense/${result.data.id}`);
		}
	});

	let receiptBlobUrl = $state<string>('');
	let receiptFile = $state<File | null>(null);

	const handleChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			if (receiptBlobUrl) {
				URL.revokeObjectURL(receiptBlobUrl);
			}
			receiptFile = file;
			receiptBlobUrl = URL.createObjectURL(file);
		}
	};

	const currencySuggestions = useCurrencySuggestions();

	//context
	const membersQuery = $derived(
		api.group.getMembers.createQuery(
			{ groupId: $formData.groupId },
			{ enabled: uuidSchema.safeParse($formData.groupId).success }
		)
	);

	const activeElement = useActiveElement();
</script>

<svelte:head>
	<title>Create Expense - SplitEasy</title>
</svelte:head>

<div
	class="container mx-auto max-w-2xl px-4 py-8"
	style="
	padding-bottom: calc(env(keyboard-inset-height, 0px) + var(--spacing) * 8 + var(--spacing) * 12 * var(--datalist-open, 0));
	"
>
	<Card.Root>
		<Card.Header>
			<Card.Title>Create New Expense</Card.Title>
			<Card.Description>Create a new expense to split with friends</Card.Description>
		</Card.Header>

		<form use:enhance>
			<Card.Content class="space-y-6">
				<Form.Field {form} name="receiptImageUrl">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Do you have a receipt?</Form.Label>
							<!-- bind:value={$formData.receiptImageUrl} -->
							<Avatar.Root
								class="h-auto min-h-32 w-full overflow-hidden rounded-lg border border-border shadow-xs"
							>
								<Avatar.Image
									class="aspect-auto w-full rounded-lg"
									src={receiptBlobUrl}
									alt="Receipt"
								/>
								<Avatar.Fallback
									class="flex aspect-auto min-h-32 items-center justify-center rounded-lg bg-transparent shadow-xs"
								>
									<Receipt class="block stroke-muted-foreground" />
								</Avatar.Fallback>
							</Avatar.Root>

							<Button class="relative" variant="outline" type="button">
								<label for="receipt-upload" class="absolute inset-0">
									<Input
										id="receipt-upload"
										class="hidden"
										accept="image/*"
										type="file"
										onchange={handleChange}
										disabled={$createExpense.isPending}
									/>
								</label>
								<Upload /> Upload
							</Button>
							<Button class="relative" variant="outline" type="button">
								<label for="receipt-scan" class="absolute inset-0"></label>
								<Input
									id="receipt-scan"
									class="hidden"
									accept="image/*"
									capture="environment"
									type="file"
									onchange={handleChange}
									disabled={$createExpense.isPending}
								/>
								<Scan /> Scan
							</Button>
						{/snippet}
					</Form.Control>
					<Form.Description>Upload a receipt image for this expense</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
				<!-- Group Id Field -->
				<Form.Field {form} name="groupId">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Group</Form.Label>
							<Button
								{...props}
								variant="outline"
								type="button"
								onclick={() => (drawers.groups = true)}
							>
								{$groupsQuery.data?.items.find((f) => f.id === $formData.groupId)?.name ||
									'Select Group'}
								<ChevronDown />
							</Button>
						{/snippet}
					</Form.Control>
					<Form.Description>Choose a group to add this expense to</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Expense Name Field -->
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Expense Name</Form.Label>
							<Input
								{...props}
								placeholder="Expense Name"
								bind:value={$formData.name}
								disabled={$createExpense.isPending}
								autocomplete="off"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>Choose a name for your expense</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
				{#if $membersQuery.isSuccess}
					<Form.Field {form} name="payers">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Who paid?</Form.Label>
								{#each $formData.payers as payer}
									{@const member = $membersQuery.data.find((m) => m.userId === payer.userId)}
									{#if member}
										<InputGroup.Root>
											<InputGroup.Addon>
												<Avatar.Root class="h-6 w-6 flex-shrink-0">
													<Avatar.Image src={member.user.img} />
													<Avatar.Fallback>{member.user.name[0]}</Avatar.Fallback>
												</Avatar.Root>
												<InputGroup.Text>{member.user.name}</InputGroup.Text>
											</InputGroup.Addon>
											<InputGroup.Input
												{...props}
												placeholder="Amount"
												disabled={$createExpense.isPending}
												class="text-right"
												inputmode="numeric"
												autocomplete="off"
											/>
										</InputGroup.Root>
									{/if}
								{/each}
								<Command.Root class="bg-transparent">
									<CommandPrimitive.Input
										id="add-input"
										data-slot="command-input"
										class={cn(
											'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
										)}
										placeholder="Add Payer or Item..."
									/>
									<VisualViewportView forceOverlaysContent>
										{#if activeElement.current?.id === 'add-input'}
											<div transition:slide={{ axis: 'y' }}>
												<Command.List
													class="absolute inset-0 top-auto flex items-start gap-3 overflow-auto border-t border-border bg-background px-3 py-1 text-foreground"
												>
													<Command.Group>
														{#each $membersQuery.data as member}
															{#if !$formData.payers.some((p) => p.userId === member.userId)}
																<Command.Item
																	value={member.user.name}
																	onpointerdown={(e) => {
																		e.preventDefault();
																		e.stopPropagation();
																	}}
																	onSelect={() => {
																		$formData.payers = [
																			...$formData.payers,
																			{ userId: member.userId, amount: '' as `${number}` }
																		];
																	}}
																>
																	<b>{member.user.name}</b>
																</Command.Item>
															{/if}
														{/each}
														<Command.Item
															value="Item"
															onSelect={() => {
																$formData.items = [
																	...$formData.items,
																	{
																		name: '' as string,
																		amountExpression: '' as `${number}`,
																		split: []
																	}
																];
															}}
														>
															<b>{}</b>
														</Command.Item>
													</Command.Group>
												</Command.List>
											</div>
										{/if}
									</VisualViewportView>
								</Command.Root>
							{/snippet}
						</Form.Control>
						<!-- <Form.Description>Add Payers</Form.Description> -->
						<Form.FieldErrors />
					</Form.Field>
				{/if}

				<!-- Currency Field -->
				<Form.Field {form} name="currency">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Currency</Form.Label>
							<Button
								{...props}
								variant="outline"
								type="button"
								onclick={() => (drawers.currency = true)}
							>
								{currencies.find((c) => c.code === $formData.currency)?.currency ||
									'Select Currency'}
								<ChevronDown />
							</Button>
						{/snippet}
					</Form.Control>
					<Form.Description>Choose a currency for this expense</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Metadata Fields -->
				<Form.Field {form} name="category">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Category</Form.Label>
							<Button
								{...props}
								variant="outline"
								type="button"
								onclick={() => (drawers.category = true)}
							>
								{Object.values(categories).find((c) => c.code === $formData.category)?.name ||
									'Select Category'}
								<ChevronDown />
							</Button>
						{/snippet}
					</Form.Control>
					<Form.Description>Choose category for this expense</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="notes">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Describe your split</Form.Label>
							<Textarea
								{...props}
								placeholder="Add notes"
								bind:value={$formData.notes}
								disabled={$createExpense.isPending}
								autocomplete="off"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>Notes for this expense</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>

			<Card.Footer class="flex justify-between">
				<Button
					type="button"
					variant="outline"
					onclick={() => goto('/dashboard')}
					disabled={$createExpense.isPending}
				>
					Cancel
				</Button>

				<!-- <Button type="button" disabled={$createExpense.isPending}>
					{#if !$createExpense.isPending}
						<Spinner /> Fixing with AI...
					{:else}
						<Sparkles />
						Fix using AI
					{/if}
				</Button> -->

				<Button type="submit" disabled={$createExpense.isPending}>
					{#if $createExpense.isPending}
						<Spinner /> Creating...
					{:else}
						<Plus /> Create Expense
					{/if}
				</Button>
			</Card.Footer>
		</form>
		{JSON.stringify($formData, null, 2)}
	</Card.Root>
</div>

<Drawer.Root bind:open={drawers.groups}>
	<Drawer.Content class="h-[calc(100vh-16rem)]">
		<Command.Root class="bg-transparent">
			<Command.Input placeholder="Search groups..." />
			<Command.List>
				<Command.Empty>
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<UsersGroup />
							</Empty.Media>
							<Empty.Title>No Groups Found</Empty.Title>
						</Empty.Header>
					</Empty.Root>
				</Command.Empty>
				<Command.Group>
					{#each $groupsQuery.data?.items as group}
						<Command.Item
							value={group.name}
							onSelect={() => {
								$formData.groupId = group.id;
								drawers.groups = false;
							}}
						>
							<b>{group.name}</b>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Drawer.Content>
</Drawer.Root>

<Drawer.Root bind:open={drawers.currency}>
	<Drawer.Content class="h-[calc(100vh-16rem)]">
		<Command.Root class="flex flex-col bg-transparent">
			<Command.Input placeholder="Search by code, name or countries..." />
			<Command.List class="max-h-full flex-1">
				<Command.Empty>
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<CashBanknote />
							</Empty.Media>
							<Empty.Title>No Currencies Found</Empty.Title>
						</Empty.Header>
					</Empty.Root>
				</Command.Empty>

				<Command.Group title="Currencies" heading="Suggestions">
					{#if $currencySuggestions.isLoading}
						{#each Array.from({ length: 2 }) as _}
							<Command.Item>
								<Skeleton class="h-6 w-full" />
							</Command.Item>
						{/each}
					{:else if $currencySuggestions.isSuccess}
						{#each $currencySuggestions.data as currency (currency.code)}
							<Command.Item
								value={[currency.code, currency.currency, ...currency.countries].join(' ')}
								onSelect={() => {
									$formData.currency = currency.code;
									drawers.currency = false;
								}}
								class="flex items-center justify-between gap-2"
							>
								<b>{currency.currency}</b>
								<span>{currency.code}</span>
							</Command.Item>
						{/each}
					{/if}
				</Command.Group>
				<Command.Group title="Currencies" heading="Rest">
					{#each currencies.filter((currency) => !$currencySuggestions.data?.includes(currency)) as currency (currency.code)}
						<Command.Item
							value={[currency.code, currency.currency, ...currency.countries].join(' ')}
							onSelect={() => {
								$formData.currency = currency.code;
								drawers.currency = false;
							}}
							class="flex items-center justify-between gap-2"
						>
							<b>{currency.currency}</b>
							<span>{currency.code}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Drawer.Content>
</Drawer.Root>

<Drawer.Root bind:open={drawers.category}>
	<Drawer.Content class="h-[calc(100vh-16rem)]">
		<Command.Root class="flex flex-col bg-transparent">
			<Command.Input placeholder="Search categories..." />
			<Command.List class="max-h-full flex-1">
				<Command.Empty>
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<Category />
							</Empty.Media>
							<Empty.Title>No Categories Found</Empty.Title>
						</Empty.Header>
					</Empty.Root>
				</Command.Empty>
				<Command.Group>
					{#each Object.values(categories) as category}
						<Command.Item
							value={category.code}
							onSelect={() => {
								$formData.category = category.code;
								drawers.category = false;
							}}
							class="flex items-center justify-between gap-2"
						>
							<b>{category.icon} {category.name}</b>
							<span class="text-xs text-muted-foreground/50">{category.description}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Drawer.Content>
</Drawer.Root>

<style>
	/* calender webkit hidden */
	:global(input::-webkit-calendar-picker-indicator) {
		display: none !important;
	}
</style>
