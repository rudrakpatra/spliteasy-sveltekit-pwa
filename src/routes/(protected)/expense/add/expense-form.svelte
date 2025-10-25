<script lang="ts">
	import { getExpenseFormContext } from './context.svelte';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import Plus from '@tabler/icons-svelte/icons/plus';

	// import fields
	import ReceiptField from './fields/ask-ai-field.svelte';
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
	import { useIME } from '$lib/hooks/use-ime.svelte';
	import ContextViewer from './context-viewer.svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const ctx = getExpenseFormContext();

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

	let step = $state(1);
</script>

<DataList.Root>
	<Card.Root class="mx-auto min-h-dvh max-w-2xl border-0 shadow-none">
		<Card.Header>
			<Card.Title>Create New Expense</Card.Title>
			<Card.Description>Create a new expense to split with friends</Card.Description>
		</Card.Header>
		<Card.Content class="flex-1 space-y-4">
			<!-- {#if step == 1} -->
			<ReceiptField />
			<ExpenseNameField />
			<CurrencyField />
			<GroupField />
			<!-- {:else if step == 2} -->
			<PayersField />
			<ItemsField />
			<SplitsField />
			<!-- {:else if step == 3} -->
			<NotesField />
			<CategoryField />
			<!-- {/if} -->
		</Card.Content>

		<Card.Footer class="flex justify-between">
			<!-- {#if step == 1} -->
			<Button
				type="button"
				variant="outline"
				onclick={() => goto('/dashboard')}
				disabled={isSubmitting}
			>
				Cancel
			</Button>
			<!-- {:else}
				<Button type="button" variant="outline" onclick={() => step--}>
					<ArrowLeft /> Back
				</Button>
			{/if} -->

			<!-- {#if step == 1}
				<Button type="button" onclick={() => step++} disabled={isSubmitting}>
					<ArrowRight /> Next
				</Button>
			{:else if step == 2}
				<Button type="button" onclick={() => step++} disabled={isSubmitting}>
					<ArrowRight /> Next
				</Button>
			{:else if step == 3} -->
			<Button type="submit" disabled={isSubmitting}>
				{#if isSubmitting}
					<Spinner /> Creating...
				{:else}
					<Plus /> Create Expense
				{/if}
			</Button>
			<!-- {/if} -->
		</Card.Footer>
	</Card.Root>
</DataList.Root>
<!-- <ContextViewer /> -->
