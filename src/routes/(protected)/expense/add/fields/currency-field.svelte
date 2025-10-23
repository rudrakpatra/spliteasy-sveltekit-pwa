<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { currencies, type CurrencyCode } from '$lib/shared/currency/currency-codes';
	import { currencyCodeSchema, currencyLabel } from '$lib/shared/currency/currency';
	import { useCurrencySuggestions } from '$lib/hooks/use-currency-suggestions';
	import { Spinner } from '$lib/components/ui/spinner';
	import ChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import ChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import Check from '@tabler/icons-svelte/icons/check';
	import CurrencyDrawer from '../drawers/currency-drawer.svelte';
	import { untrack } from 'svelte';

	const ctx = getExpenseFormContext();
	const { form } = ctx;
	const { form: formData } = form;

	const currencySuggestions = useCurrencySuggestions();
	let currencyDrawerOpen = $state(false);

	// Auto-set currency
	$effect(() => {
		if ($currencySuggestions.isSuccess && $formData) {
			const currentCurrency = untrack(() => $formData.currency);
			const parsed = currencyCodeSchema.safeParse($currencySuggestions.data[0].code);
			if (!currentCurrency && parsed.success) {
				$formData.currency = parsed.data;
			}
		}
	});
</script>

<Form.Field {form} name="currency">
	<Form.Control>
		{#snippet children({ props })}
			{@const currency = currencies.find((c) => c.code === $formData.currency)}
			{@const success = $currencySuggestions.isSuccess}

			{#snippet trigger()}
				<Button
					onclick={(e) => {
						e.preventDefault();
						if (!$currencySuggestions.isSuccess) {
							currencyDrawerOpen = true;
						}
					}}
					{...props}
					variant="outline"
					type="button"
				>
					{#if currency}
						{currencyLabel(currency)}
					{:else}
						{#if $currencySuggestions.isLoading}<Spinner />{/if} Select a currency
					{/if}
					<ChevronDown />
				</Button>
			{/snippet}

			<Form.Label>Currency</Form.Label>

			{#if success}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet children()}
							{@render trigger()}
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="start">
						{#each $currencySuggestions.data as curr (curr.code)}
							<DropdownMenu.Item
								onSelect={() => {
									$formData.currency = curr.code as CurrencyCode;
								}}
								class="flex items-center justify-between"
							>
								<span>{curr.currency}</span>
								{#if $formData.currency === curr.code}
									<Check />
								{/if}
							</DropdownMenu.Item>
						{/each}

						<DropdownMenu.Separator />

						<DropdownMenu.Item
							onSelect={() => {
								currencyDrawerOpen = true;
							}}
							class="flex items-center justify-between"
						>
							<span>Show all currencies</span>
							<ChevronRight />
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{:else}
				{@render trigger()}
			{/if}
		{/snippet}
	</Form.Control>
	<Form.Description>Choose a currency for this expense</Form.Description>
	<Form.FieldErrors />
</Form.Field>

<CurrencyDrawer bind:open={currencyDrawerOpen} />
