<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { currencies, type CurrencyCode } from '$lib/shared/currency/currency-codes';
	import { currencyCodeSchema, currencyLabel } from '$lib/shared/currency/currency';
	import { useCurrencySuggestions } from '$lib/hooks/use-currency-suggestions';
	import { Spinner } from '$lib/components/ui/spinner';
	import ChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import ChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import Check from '@tabler/icons-svelte/icons/check';
	import CurrencyDrawer from '../drawers/currency-drawer.svelte';
	import { cn } from '$lib/utils';

	const ctx = getExpenseFormContext();

	const currencySuggestions = useCurrencySuggestions();
	let currencyDrawerOpen = $state(false);

	// Auto-set currency
	$effect(() => {
		if (
			!ctx.currency.current &&
			$currencySuggestions.isSuccess &&
			currencyCodeSchema.safeParse($currencySuggestions.data[0].code).success
		) {
			ctx.currency.set($currencySuggestions.data[0].code);
		}
	});

	const currency = $derived(currencies.find((c) => c.code === ctx.currency.current));
</script>

<div class="space-y-2">
	{#snippet trigger()}
		<div class={cn('w-fit', ctx.ai.pendingFields.has('currencyCode') && 'ai-pending')}>
			<Button
				onclick={(e) => {
					e.preventDefault();
					if (!$currencySuggestions.isSuccess) {
						currencyDrawerOpen = true;
					}
				}}
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
		</div>
	{/snippet}

	<Label>Currency</Label>

	{#if $currencySuggestions.isSuccess}
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
							ctx.currency.set(curr.code as CurrencyCode);
						}}
						class="flex items-center justify-between"
					>
						<span>{curr.currency}</span>
						{#if ctx.currency.current === curr.code}
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
	<p class="text-xs text-muted-foreground">Choose a currency for this expense</p>
</div>

<CurrencyDrawer bind:open={currencyDrawerOpen} />
