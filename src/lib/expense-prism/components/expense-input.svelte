<script lang="ts">
	import type { ParticipantContext, ExpenseData } from '../parser/types';
	import { parseExpense, getExpectedType } from '../parser/simple-parser';
	import { highlightExpense } from '../utils/highlighter';
	import ExpenseSuggestions from './expense-suggestions.svelte';
	import '../styles/expense-theme.css';

	interface Props {
		context: ParticipantContext;
		value?: string;
		placeholder?: string;
		onParse?: (data: ExpenseData) => void;
		class?: string;
	}

	let {
		context,
		value = $bindable(''),
		placeholder = 'Alice paid 100 + 25% for Burger...',
		onParse,
		class: className = ''
	}: Props = $props();

	let inputElement = $state<HTMLDivElement | null>(null);
	let overlayElement = $state<HTMLDivElement | null>(null);
	let parsedData = $state<ExpenseData | null>(null);
	let expectedType = $state<string>('start');

	function handleInput(e: Event) {
		const target = e.target as HTMLDivElement;
		value = target.textContent || '';

		// Update expected type for suggestions
		expectedType = getExpectedType(value);

		// Update syntax highlighting overlay
		if (overlayElement) {
			overlayElement.innerHTML = highlightExpense(value, context);
		}
	}

	function handleBlur() {
		if (!value.trim()) return;

		// Parse the input
		parsedData = parseExpense(value, context);

		// Call callback
		if (onParse && parsedData) {
			onParse(parsedData);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		// Prevent formatting shortcuts
		if (e.ctrlKey || e.metaKey) {
			if (['b', 'i', 'u'].includes(e.key.toLowerCase())) {
				e.preventDefault();
			}
		}

		// Handle Enter
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			(e.target as HTMLElement).blur();
		}
	}

	// Sync scroll between input and overlay
	function handleScroll() {
		if (inputElement && overlayElement) {
			overlayElement.scrollTop = inputElement.scrollTop;
			overlayElement.scrollLeft = inputElement.scrollLeft;
		}
	}

	$effect(() => {
		if (inputElement) {
			inputElement.id = 'expense-prism-input';
		}
	});
</script>

<div class="expense-input-wrapper {className}">
	<!-- Syntax highlighting overlay -->
	<div bind:this={overlayElement} class="expense-overlay" aria-hidden="true"></div>

	<!-- Actual editable input -->
	<div
		bind:this={inputElement}
		contenteditable="true"
		class="expense-input"
		data-placeholder={placeholder}
		role="textbox"
		tabindex={0}
		aria-label="Expense description"
		spellcheck="false"
		oninput={handleInput}
		onblur={handleBlur}
		onkeydown={handleKeydown}
		onscroll={handleScroll}
	></div>

	<ExpenseSuggestions inputId="expense-prism-input" {context} {expectedType} />
</div>

<style>
	.expense-input-wrapper {
		position: relative;
		width: 100%;
	}

	.expense-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 0.75rem;
		pointer-events: none;
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow: hidden;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		color: transparent;
		z-index: 1;
	}

	.expense-input {
		position: relative;
		width: 100%;
		min-height: 2.5rem;
		padding: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		background: transparent;
		font-family: inherit;
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: transparent;
		caret-color: hsl(var(--foreground));
		z-index: 2;
		outline: none;
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-y: auto;
	}

	.expense-input:focus {
		border-color: hsl(var(--ring));
		box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
	}

	.expense-input:empty:before {
		content: attr(data-placeholder);
		color: hsl(var(--muted-foreground));
		position: absolute;
		pointer-events: none;
	}
</style>
