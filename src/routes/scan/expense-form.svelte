<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	// import fields
	import ReceiptField from './fields/ask-ai-field.svelte';
	import PayersField from './fields/participants-field.svelte';
	import ItemsField from './fields/items-field.svelte';
	import SplitsField from './fields/splits-field.svelte';
	import ReviewForm from './review-form.svelte';
	import * as DataList from '$lib/components/ui/data-list';
	import { useActiveElement } from '$lib/hooks/activeElement/active-element-context.svelte';
	import { useIME } from '$lib/hooks/use-ime.svelte';
	import CurrencyField from './fields/currency-field.svelte';

	// const ctx = getExpenseFormContext();

	// Access mutation status from form
	// const isSubmitting = $derived(ctx.submitting);
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
	<Card.Root class="mx-auto min-h-dvh max-w-2xl border-0 shadow-none">
		<Card.Header>
			<Card.Title>Create New Expense</Card.Title>
			<Card.Description>Create a new expense to split with friends</Card.Description>
		</Card.Header>
		<Card.Content class="flex-1 space-y-4">
			<ReceiptField />
			<CurrencyField />
			<PayersField />
			<ItemsField />
			<SplitsField />
			<ReviewForm />
		</Card.Content>
	</Card.Root>
</DataList.Root>
