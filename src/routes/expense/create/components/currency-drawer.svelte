<!-- routes/expense/create/components/currency-drawer.svelte -->
<script lang="ts">
    import * as Drawer from '$lib/components/ui/drawer';
    import * as Command from '$lib/components/ui/command';
    import * as Empty from '$lib/components/ui/empty';
    import { currencies } from '$lib/shared/currency/currency-codes';
    import { useCurrencySuggestions } from '$lib/hooks/use-currency-suggestions';
    import CashBanknote from '@tabler/icons-svelte/icons/cash-banknote';
    import { Skeleton } from '$lib/components/ui/skeleton';

    let {
        open = $bindable(),
        selectedCurrency = $bindable()
    }: {
        open: boolean;
        selectedCurrency: string;
    } = $props();

    const currencySuggestions = useCurrencySuggestions();
</script>

<Drawer.Root bind:open>
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
                                    selectedCurrency = currency.code;
                                    open = false;
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
                                selectedCurrency = currency.code;
                                open = false;
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
