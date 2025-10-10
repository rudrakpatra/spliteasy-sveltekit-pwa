
import { createQuery, queryOptions } from '@tanstack/svelte-query';
import { getCurrencySuggestions } from '$lib/currency/currency';


export const currencySuggestionsQuery = queryOptions({
    queryKey: ['currency', 'locale'] as const,
    queryFn: getCurrencySuggestions,
    staleTime: 1000 * 60 * 60 * 24,
});

export const useCurrencySuggestions = () => {
    return createQuery(currencySuggestionsQuery);
};