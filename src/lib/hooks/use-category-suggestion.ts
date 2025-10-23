
import { createQuery, queryOptions } from '@tanstack/svelte-query';
import { categories } from '$lib/shared/category/category';

export const getCategorySuggestion = async () => {
    // wait 1 sec
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const category: keyof typeof categories = "OTHER";
    return category;
}

export const categorySuggestionQuery = queryOptions({
    queryKey: ['category'] as const,
    queryFn: getCategorySuggestion,
    staleTime: 1000 * 60 * 60 * 24,
});

export const useCategorySuggestion = () => {
    return createQuery(categorySuggestionQuery);
};