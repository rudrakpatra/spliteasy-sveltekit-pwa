<script lang="ts">
	import type { ParticipantContext, ExpenseAST } from '../parser/types';
	import { parseExpense } from '../parser/parser';
	import { renderTokens, stripHtmlToPlainText } from '../utils/renderer';
	import { saveSelection, restoreSelection, getCaretPosition } from '../utils/selection';
	import { shouldShowMathOperators } from '../utils/autocomplete';
	import DslSuggestions from './dsl-suggestions.svelte';
	import '../styles/dsl.css';

	interface Props {
		context: ParticipantContext;
		value?: string;
		placeholder?: string;
		onParse?: (ast: ExpenseAST) => void;
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
	let ast = $state<ExpenseAST | null>(null);
	let showMath = $state(false);
	let isComposing = $state(false);

	function handleInput(e: Event) {
		if (!inputElement || isComposing) return;

		const target = e.target as HTMLDivElement;
		value = stripHtmlToPlainText(target.innerHTML);

		// Parse in real-time
		parseAndRender();

		// Check if we should show math operators
		const caretPos = getCaretPosition(target);
		showMath = shouldShowMathOperators(value, caretPos);
	}

	function parseAndRender() {
		if (!inputElement || !value.trim()) {
			ast = null;
			return;
		}

		// Save cursor position
		// const savedSel = saveSelection();

		// Parse the input
		ast = parseExpense(value, context);

		// Render styled tokens
		// const html = renderTokens(ast.tokens);

		// Only update if content changed
		// if (inputElement.innerHTML !== html) {
		// 	inputElement.innerHTML = html;

		// 	// Restore cursor position
		// 	// if (savedSel) {
		// 	// 	setTimeout(() => {
		// 	// 		if (inputElement) {
		// 	// 			restoreSelection(inputElement, savedSel);
		// 	// 		}
		// 	// 	}, 0);
		// 	// }
		// }

		// Call onParse callback
		if (onParse && ast) {
			onParse(ast);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		// Prevent formatting shortcuts
		if (e.ctrlKey || e.metaKey) {
			if (['b', 'i', 'u'].includes(e.key.toLowerCase())) {
				e.preventDefault();
			}
		}

		// Handle Enter key - start new line (new statement)
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			document.execCommand('insertText', false, '\n');
		}
	}

	// Prevent editing inside non-editable tokens
	function handleMouseDown(e: MouseEvent) {
		const target = e.target as HTMLElement;

		// If clicking inside a token span, move cursor after it
		if (
			target.tagName === 'SPAN' &&
			(target.classList.contains('dsl-member') ||
				target.classList.contains('dsl-keyword') ||
				target.classList.contains('dsl-operator') ||
				target.classList.contains('dsl-item'))
		) {
			e.preventDefault();

			// Move cursor after the span
			const range = document.createRange();
			const sel = window.getSelection();

			range.setStartAfter(target);
			range.collapse(true);

			sel?.removeAllRanges();
			sel?.addRange(range);
		}
	}

	// Handle composition events (for IME input)
	function handleCompositionStart() {
		isComposing = true;
	}

	function handleCompositionEnd() {
		isComposing = false;
		handleInput(new Event('input'));
	}

	// Set input ID for DataList integration
	$effect(() => {
		if (inputElement) {
			inputElement.id = 'expense-dsl-input';
		}
	});
</script>

<div class="relative">
	<div
		bind:this={inputElement}
		contenteditable="true"
		class="dsl-input {className}"
		data-placeholder={placeholder}
		data-invalid={ast && !ast.isValid}
		role="textbox"
		tabindex={0}
		aria-label="Expense description"
		aria-invalid={ast && !ast.isValid}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onmousedown={handleMouseDown}
		oncompositionstart={handleCompositionStart}
		oncompositionend={handleCompositionEnd}
	></div>

	<DslSuggestions inputId="expense-dsl-input" {context} {ast} {showMath} />
</div>
