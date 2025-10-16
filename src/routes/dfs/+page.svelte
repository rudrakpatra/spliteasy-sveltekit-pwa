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
	import z from 'zod';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import VisualViewportView from '$lib/components/ui/visual-viewport-view/visual-viewport-view.svelte';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import { Editor } from '@tiptap/core';
	import Document from '@tiptap/extension-document';
	import Text from '@tiptap/extension-text';
	import Paragraph from '@tiptap/extension-paragraph';
	import Placeholder, { type PlaceholderOptions } from '@tiptap/extension-placeholder';
	import { onMount } from 'svelte';
	import Suggestion, { type SuggestionProps } from './suggestion.svelte';
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

	let element: HTMLElement | undefined = $state();
	let editor: Editor | undefined = $state();

	const getPlaceholder: PlaceholderOptions['placeholder'] = ({ node, pos }) => {
		const lineNumber = editor?.state.doc.resolve(pos).node().childCount || 0;
		console.log(lineNumber);

		if ($membersQuery.isLoading) {
			return 'Loading...';
		} else if ($membersQuery.isSuccess) {
			if ($membersQuery.data.length === 0) {
				return 'No members found';
			}

			// Find members who have not paid
			const memberIds = new Set($membersQuery.data.map((member) => member.userId));
			const payerIds = new Set($formData.payers.map((payer) => payer.userId));
			const notPaidMemberIds = [...memberIds].filter((memberId) => !payerIds.has(memberId));

			if (notPaidMemberIds.length === 0) {
				return 'All members have paid';
			}

			// Get the first member who hasn't paid
			const member = $membersQuery.data.find(
				(m) => m.userId === notPaidMemberIds[lineNumber % notPaidMemberIds.length]
			);

			if (member) {
				return `${member.user.name} paid 10.50`;
			}

			return 'Add transaction...';
		} else {
			if (!$membersQuery.isEnabled) {
				return 'Select Group';
			}
			return '...';
		}
	};

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [
				Document,
				Text,
				Paragraph,
				Placeholder.configure({
					placeholder: getPlaceholder,
					showOnlyCurrent: false,
					includeChildren: true
				})
			],
			content: '<p></p>'
		});

		return () => {
			editor?.destroy();
		};
	});

	$effect(() => {
		if (editor && $membersQuery) {
			const placeholderExt = editor.extensionManager.extensions.find(
				(ext) => ext.name === 'placeholder'
			);

			if (placeholderExt) {
				placeholderExt.options.placeholder = getPlaceholder;
				editor.view.dispatch(editor.state.tr);
			}
		}
	});

	const members = $derived(
		$membersQuery.isSuccess ? $membersQuery.data.map((member) => member.user.name) : []
	);

	const curre = $derived(
		$currencySuggestions.isSuccess
			? $currencySuggestions.data.map((currency) => currency.currency)
			: []
	);

	const suggestions = $derived<SuggestionProps[]>([
		...members.map((member) => ({
			label: member,
			cmd: () => editor?.commands.setContent(member)
		})),
		...curre.map((currency) => ({
			label: currency,
			cmd: () => editor?.commands.setContent(currency)
		}))
	]);
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
							<!-- <Select.Root type="single" name="groupId" bind:value={$formData.groupId}>
								<Select.Trigger {...props}>
									{$groupsQuery.data?.items.find((f) => f.id === $formData.groupId)?.name ??
										'Select a group'}
								</Select.Trigger>
								<Select.Content>
									<Select.Group>
										<Select.Label>Groups</Select.Label>
										{#each $groupsQuery.data?.items as group (group.id)}
											<Select.Item value={group.id} label={group.name}>
												{group.name}
											</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root> -->
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
							<div
								{...props}
								bind:this={element}
								class={cn(
									'editor-container flex field-sizing-content w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
									''
								)}
								role="textbox"
								tabindex={0}
							></div>
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

<VisualViewportView forceOverlaysContent>
	{#if suggestions.length > 0}
		<div
			transition:slide={{ axis: 'y' }}
			class="absolute inset-0 top-auto flex items-start gap-3 overflow-auto border-t border-border bg-background px-3 py-1 text-foreground"
		>
			{#each suggestions as suggestion}
				<Suggestion {...suggestion} />
			{/each}
		</div>
	{/if}
</VisualViewportView>

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
				{#if $currencySuggestions.isSuccess}
					<Command.Group title="Currencies" heading="Suggestions">
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
				{:else}
					<Command.Group title="Currencies">
						{#each currencies as currency (currency.code)}
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
				{/if}

				<!-- <Command.Group title="Currencies" heading="By Code">
					{#each currencies as currency (currency.code)}
						<Command.Item
							value={currency.code}
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
				<Command.Group title="Currencies" heading="By Name">
					{#each currencies as currency (currency.code)}
						<Command.Item
							value={currency.currency}
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
				<Command.Group title="Currencies" heading="By Country">
					{#each currencies as currency (currency.code)}
						<Command.Item
							value={currency.countries.join(' ')}
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
				</Command.Group> -->
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
						>
							{category.name}
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
	.editor-container {
		min-height: calc(var(--spacing) * 16);
	}

	.editor-container :global(.tiptap) {
		min-height: calc(var(--spacing) * 16);
		width: 100%;
	}

	.editor-container :global(.tiptap:focus) {
		outline: none;
	}

	.editor-container :global(.tiptap p.is-empty::before) {
		color: var(--color-muted-foreground);
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	.editor-container :global(.tiptap p.is-editor-empty:first-child::before) {
		color: var(--color-muted-foreground);
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
</style>
