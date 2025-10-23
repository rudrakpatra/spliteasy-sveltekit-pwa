<script lang="ts">
	import { getExpenseFormContext } from './context.svelte';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import Plus from '@tabler/icons-svelte/icons/plus';

	// import fields
	import ReceiptField from './fields/receipt-field.svelte';
	import ExpenseNameField from './fields/expense-name-field.svelte';
	import CurrencyField from './fields/currency-field.svelte';
	import GroupField from './fields/groups-field.svelte';
	import PayersField from './fields/payers-field.svelte';
	import ItemsField from './fields/items-field.svelte';
	import SplitsField from './fields/splits-field.svelte';
	import NotesField from './fields/notes-field.svelte';
	import CategoryField from './fields/category-field.svelte';
	import * as DataList from '$lib/components/ui/data-list';
	import { useActiveElement } from '$lib/hooks/activeElement/active-element-context.svelte';
	import KeyboardAwareView from '$lib/components/ui/view/keyboard-aware-view.svelte';
	import { useIME } from '$lib/hooks/use-ime.svelte';

	const ctx = getExpenseFormContext();
	const { form } = ctx;
	const { enhance } = form;

	// Access mutation status from form
	const isSubmitting = $derived(ctx.submitting);
	const activeElement = useActiveElement();
	const ime = useIME();
	$effect(() => {
		//scroll activeElement to view with padding
		if (activeElement.current instanceof HTMLElement) {
			const scrollIntoView = activeElement.current.getAttribute('data-scroll-into-view');
			if (scrollIntoView) {
				// check if the rect is inside the ime safe region
				if (!ime.isElementInSafeArea(activeElement.current)) {
					activeElement.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}
		}
	});
</script>

<DataList.Root>
	<Card.Root class="mx-auto max-w-2xl border-0 shadow-none">
		<Card.Header>
			<Card.Title>Create New Expense</Card.Title>
			<Card.Description>Create a new expense to split with friends</Card.Description>
		</Card.Header>

		<form use:enhance>
			<Card.Content class="space-y-6">
				<ReceiptField />
				<ExpenseNameField />
				<CurrencyField />
				<GroupField />
				<PayersField />
				<ItemsField />
				<SplitsField />
				<NotesField />
				<CategoryField />
			</Card.Content>

			<Card.Footer class="flex justify-between">
				<Button
					type="button"
					variant="outline"
					onclick={() => goto('/dashboard')}
					disabled={isSubmitting}
				>
					Cancel
				</Button>

				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Spinner /> Creating...
					{:else}
						<Plus /> Create Expense
					{/if}
				</Button>
			</Card.Footer>
		</form>
	</Card.Root>
</DataList.Root>
