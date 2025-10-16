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
	import { toast } from 'svelte-sonner';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import ChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import { Spinner } from '$lib/components/ui/spinner';
	import { currencies } from '$lib/shared/currency/currency-codes';
	import { categories } from '$lib/shared/category/category';

	import ReceiptUpload from './components/receipt-upload.svelte';
	import PayersField from './components/payers-field.svelte';
	import GroupDrawer from './components/group-drawer.svelte';
	import CurrencyDrawer from './components/currency-drawer.svelte';
	import CategoryDrawer from './components/category-drawer.svelte';

	let { data }: { data: PageData } = $props();

	const api = trpc(page, data.queryClient);
	const utils = api.createUtils();

	const createExpense = api.expense.insert.createMutation({
		onSuccess: (expense) => {
			utils.expense.getProposed.invalidate();
			goto(`/expense/${expense.id}`);
		},
		onError: (error) => {
			toast.error('Failed to create expense', { description: error.message });
		}
	});

	const form = superForm(defaults(zod4(createExpenseSchema)), {
		SPA: true,
		validators: zod4(createExpenseSchema),
		resetForm: false,
		onUpdate({ form }) {
			if (form.valid) {
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
		{ limit: 20, offset: 0 },
		{ refetchInterval: Infinity }
	);

	createExpense.subscribe((result) => {
		if (result.status === 'success') {
			goto(`/expense/${result.data.id}`);
		}
	});
</script>

<svelte:head>
	<title>Create Expense - SplitEasy</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<Card.Root>
		<Card.Header>
			<Card.Title>Create New Expense</Card.Title>
			<Card.Description>Create a new expense to split with friends</Card.Description>
		</Card.Header>

		<form use:enhance>
			<Card.Content class="space-y-6">
				<ReceiptUpload {form} isPending={$createExpense.isPending} />

				<!-- Group Field -->
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

				<!-- Expense Name -->
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

				<PayersField
					{form}
					bind:formData={$formData}
					groupId={$formData.groupId}
					isPending={$createExpense.isPending}
				/>

				<!-- Currency -->
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

				<!-- Category -->
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

				<!-- Notes -->
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

<GroupDrawer bind:open={drawers.groups} {groupsQuery} bind:selectedGroupId={$formData.groupId} />
<CurrencyDrawer bind:open={drawers.currency} bind:selectedCurrency={$formData.currency} />
<CategoryDrawer bind:open={drawers.category} bind:selectedCategory={$formData.category} />

<style>
	:global(input::-webkit-calendar-picker-indicator) {
		display: none !important;
	}
</style>
