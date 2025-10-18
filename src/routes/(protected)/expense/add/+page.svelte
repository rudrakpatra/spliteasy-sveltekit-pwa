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
	import * as Empty from '$lib/components/ui/empty';
	import UsersGroup from '@tabler/icons-svelte/icons/users-group';
	import { toast } from 'svelte-sonner';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { currencies, type CurrencyCode } from '$lib/shared/currency/currency-codes';
	import Category from '@tabler/icons-svelte/icons/category';
	import { categories } from '$lib/shared/category/category';
	import CashBanknote from '@tabler/icons-svelte/icons/cash-banknote';
	import * as Avatar from '$lib/components/ui/avatar';
	import Receipt from '@tabler/icons-svelte/icons/receipt';
	import Scan from '@tabler/icons-svelte/icons/scan';
	import Upload from '@tabler/icons-svelte/icons/upload';
	import Ai from '@tabler/icons-svelte/icons/ai';
	import ChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import Sparkles from '@tabler/icons-svelte/icons/sparkles';
	import { Spinner } from '$lib/components/ui/spinner';
	import Checks from '@tabler/icons-svelte/icons/checks';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import { useCurrencySuggestions } from '$lib/hooks/use-currency-suggestions';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Check from '@tabler/icons-svelte/icons/check';
	import { currencyFormat, currencyLabel } from '$lib/shared/currency/currency';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import z from 'zod';
	import Items from './items.svelte';
	import CheckboxButton from './checkbox-button.svelte';
	import CheckboxGroup from './checkbox-group.svelte';
	import { setExpenseFormContext } from './context.svelte';
	import { EmblaScrollArea } from '$lib/components/ui/embla-scroll-area';

	let { data }: { data: PageData } = $props();

	// Setup tRPC
	const api = trpc(page, data.queryClient);
	const utils = api.createUtils();

	const currencySuggestions = useCurrencySuggestions();

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

	// Set initial currency AFTER form is created
	let currencyInitialized = $state(false);

	$effect(() => {
		if ($currencySuggestions.isSuccess && !currencyInitialized && !$formData.currency) {
			formData.update((current) => ({
				...current,
				currency: $currencySuggestions.data[0].code
			}));
			currencyInitialized = true;
		}
	});

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

	let drawers = $state<Record<string, { open: boolean }>>({
		groups: {
			open: false
		},
		currency: {
			open: false
		},
		category: {
			open: false
		}
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

	const membersQuery = $derived(
		api.group.getMembers.createQuery(
			{
				groupId: $formData.groupId
			},
			{
				refetchInterval: Infinity,
				enabled: uuidSchema.safeParse($formData.groupId).success
			}
		)
	);

	createExpense.subscribe((result) => {
		if (result.status === 'success') {
			goto(`/expense/${result.data.id}`);
		}
	});

	let receiptBlobUrl = $state<string | null>(null);
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
	setExpenseFormContext({
		form,
		get membersQuery() {
			return membersQuery;
		},
		get groupsQuery() {
			return groupsQuery;
		},
		receipt: {
			get url() {
				return receiptBlobUrl;
			},
			get file() {
				return receiptFile;
			}
		}
	});
</script>

<svelte:head>
	<title>Create Expense - SplitEasy</title>
</svelte:head>

<div
	class="container mx-auto max-w-2xl px-4 py-8"
	style="padding-bottom: calc(env(keyboard-inset-height, 0px) + var(--spacing) * 8 + var(--spacing) * var(--datalist-height, 0));"
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

				<!-- Currency Field -->
				<Form.Field {form} name="currency">
					<Form.Control>
						{#snippet children({ props })}
							{@const currency = currencies.find((c) => c.code === $formData.currency)}
							{@const success = $currencySuggestions.isSuccess}
							{#snippet label()}
								{#if currency}
									{currencyLabel(currency)}
								{:else if success}
									<span>Select a currency</span>
								{:else}
									<span class="flex items-center gap-2 text-muted-foreground">
										<Spinner />Detecting...
									</span>
								{/if}
							{/snippet}
							<Form.Label>Currency</Form.Label>
							{#if success}
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button {...props} variant="outline" type="button">
												{@render label()}
												<ChevronDown />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="start">
										{#each $currencySuggestions.data as currency (currency.code)}
											<DropdownMenu.Item
												onSelect={() => {
													$formData.currency = currency.code as CurrencyCode;
												}}
												class="flex items-center justify-between"
											>
												<span>{currency.currency}</span>
												{#if $formData.currency === currency.code}
													<Check />
												{/if}
											</DropdownMenu.Item>
										{/each}

										<DropdownMenu.Separator />

										<DropdownMenu.Item
											onSelect={(e) => {
												drawers.currency.open = true;
											}}
											class="flex items-center justify-between"
										>
											<span>Show all currencies</span>
											<ChevronRight />
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							{:else}
								<Button
									{...props}
									variant="outline"
									type="button"
									onclick={() => (drawers.currency.open = true)}
								>
									{@render label()}
									<ChevronDown />
								</Button>
							{/if}
						{/snippet}
					</Form.Control>
					<Form.Description>Choose a currency for this expense</Form.Description>
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
								onclick={() => (drawers.groups.open = true)}
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

				<!-- Payers Field -->
				<Form.Field {form} name="items">
					<Form.Control>
						{#snippet children({ props })}
							{@const { data, isLoading, isSuccess, error } = $membersQuery}
							<Form.Label>Paid by</Form.Label>
							{#if isLoading}
								<Skeleton class="h-9 w-full" />
							{:else if isSuccess}
								<div>
									{#each data as { user }}
										<div
											class="group grid grid-cols-[1fr_auto] items-center gap-2 border-t p-2 first:border-t-0"
										>
											<label
												class="flex flex-1 items-center gap-2 whitespace-nowrap"
												for={`paid-amt-${user.id}`}
											>
												<Avatar.Root class="flex size-9 flex-shrink-0  items-center">
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
												placeholder="0"
												variant="underlined"
												class="field-sizing-content min-w-9 text-center"
												autocomplete="off"
												inputmode="numeric"
												onfocus={(e) => e.currentTarget.select()}
											/>
										</div>
									{/each}
								</div>
							{/if}
						{/snippet}
					</Form.Control>
					<Form.Description>
						{#if $formData.notes}
							Choose who paid for this expense
						{:else}
							Total {currencyFormat($formData.currency, 1000)}
						{/if}
					</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="items">
					<Form.Control>
						{#snippet children({ props })}
							{@const { data, isLoading, isSuccess, error } = $membersQuery}
							<Form.Label>Split</Form.Label>
							{#if isLoading}
								<Skeleton class="h-9 w-full" />
							{:else if isSuccess}
								<Tabs.Root value="equal">
									<Tabs.List>
										<Tabs.Trigger value="equal">Equally</Tabs.Trigger>
										<Tabs.Trigger value="shares">By Shares</Tabs.Trigger>
										<Tabs.Trigger value="items">By Items</Tabs.Trigger>
									</Tabs.List>
									<Tabs.Content value="equal" tabindex={-1}>
										<CheckboxGroup>
											{#each data as { user }}
												<div
													class="group grid grid-cols-[1fr_auto] items-center gap-2 border-t p-2 first:border-t-0"
												>
													<label class="flex items-center gap-2" for={`split-${user.id}`}>
														<Avatar.Root class="size-9 flex-shrink-0">
															<Avatar.Image src={user.img} alt={user.name} />
															<Avatar.Fallback>
																{user.name.slice(0, 1).toUpperCase()}
															</Avatar.Fallback>
														</Avatar.Root>
														<span class="flex-1 font-medium">{user.name}</span>
													</label>
													<div class="grid h-9 w-9 place-items-center">
														<CheckboxButton id={`split-${user.id}`} />
													</div>
												</div>
											{/each}
										</CheckboxGroup>
										<Form.Description>
											Each person owes {currencyFormat($formData.currency, 100.0)}
										</Form.Description>
									</Tabs.Content>

									<Tabs.Content value="shares" tabindex={-1}>
										{#each data as { user }}
											<div
												class="group grid grid-cols-[1fr_auto] items-center gap-2 border-t p-2 first:border-t-0"
											>
												<label class="flex items-center gap-2" for={`share-${user.id}`}>
													<Avatar.Root class="size-9 flex-shrink-0">
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
													placeholder="0"
													variant="underlined"
													class="field-sizing-content min-w-9 text-center"
													autocomplete="off"
													inputmode="numeric"
													onfocus={(e) => e.currentTarget.select()}
												/>
											</div>
										{/each}
										<Form.Description>
											{4} Total shares
										</Form.Description>
									</Tabs.Content>

									<Tabs.Content value="items" tabindex={-1}>
										<Items />
									</Tabs.Content>
								</Tabs.Root>
							{/if}
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="notes">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Notes</Form.Label>
							<Textarea
								{...props}
								bind:value={$formData.notes}
								disabled={$createExpense.isPending}
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>Notes for this expense</Form.Description>
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
								onclick={() => {
									drawers.category.open = true;
								}}
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
	</Card.Root>
</div>
<!-- Groups Drawer -->
<Drawer.Root bind:open={drawers.groups.open} repositionInputs={false}>
	<Drawer.Content style="padding-bottom: env(keyboard-inset-height, 0px);">
		<div
			data-vaul-no-drag
			class="overflow-y-auto overscroll-contain"
			style="height: calc(90svh - env(keyboard-inset-height, 0px));"
		>
			<Command.Root class="flex flex-col bg-transparent">
				<Command.Input autofocus placeholder="Search groups..." />
				<Command.List class="max-h-full flex-1">
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
					<Command.Group title="Groups">
						{#each $groupsQuery.data?.items as group}
							<Command.Item
								value={group.id}
								keywords={[group.name]}
								onSelect={() => {
									$formData.groupId = group.id;
									drawers.groups.open = false;
								}}
							>
								<b>{group.name}</b>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</div>
	</Drawer.Content>
</Drawer.Root>

<!-- Currencies Drawer -->
<Drawer.Root bind:open={drawers.currency.open} repositionInputs={false}>
	<Drawer.Content style="padding-bottom: env(keyboard-inset-height, 0px);">
		<div
			data-vaul-no-drag
			class="overflow-y-auto overscroll-contain"
			style="height: calc(90svh - env(keyboard-inset-height, 0px));"
		>
			<Command.Root class="flex flex-col bg-transparent">
				<Command.Input autofocus placeholder="Search by code, name or countries..." />
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
					<Command.Group title="Currencies">
						{#each currencies as currency (currency.code)}
							<Command.Item
								value={currency.code}
								keywords={[currency.code, currency.currency, ...currency.countries]}
								onSelect={() => {
									$formData.currency = currency.code;
									drawers.currency.open = false;
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
		</div>
	</Drawer.Content>
</Drawer.Root>

<!-- Categories Drawer -->
<Drawer.Root bind:open={drawers.category.open} repositionInputs={false}>
	<Drawer.Content style="padding-bottom: env(keyboard-inset-height, 0px);">
		<div
			data-vaul-no-drag
			class="overflow-y-auto overscroll-contain"
			style="height: calc(90svh - env(keyboard-inset-height, 0px));"
		>
			<Command.Root class="flex flex-col bg-transparent">
				<Command.Input autofocus placeholder="Search categories..." />
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
					<Command.Group title="Categories">
						{#each Object.values(categories) as category}
							<Command.Item
								value={category.code}
								keywords={[category.code, category.name]}
								onSelect={() => {
									$formData.category = category.code;
									drawers.category.open = false;
								}}
							>
								{category.name}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</div>
	</Drawer.Content>
</Drawer.Root>
