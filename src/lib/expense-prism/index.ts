export { default as ExpenseInput } from './components/expense-input.svelte';
export { parseExpense, getExpectedType } from '$lib/expense-prism/parser/simple-parser';
export { highlightExpense } from '$lib/expense-prism/utils/highlighter';
export type { ExpenseData, ExpenseToken, ParticipantContext, AutocompleteSuggestion } from '$lib/expense-prism/parser/types';
