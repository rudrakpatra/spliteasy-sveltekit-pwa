<script lang="ts">
	import { onMount } from 'svelte';
	import Mark from 'mark.js';
	import { mathPattern } from './math-regex';

	let container: HTMLDivElement;
	let text = $state('');
	let markInstance: Mark;
	let isRestoring = false;

	// DSL context
	const participants = ['alice', 'bob', 'charlie', 'david'];
	const items = ['coffee', 'lunch', 'dinner', 'taxi', 'groceries'];
	const actions = ['split', 'splits', 'pays', 'paid', 'owes', 'owed'];
	const adjectives = ['equally', 'evenly', 'proportionally', 'percentage', 'shares'];

	onMount(() => {
		markInstance = new Mark(container);
	});

	function saveSelection(): number {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return 0;

		const range = selection.getRangeAt(0);
		const preCaretRange = range.cloneRange();
		preCaretRange.selectNodeContents(container);
		preCaretRange.setEnd(range.endContainer, range.endOffset);

		return preCaretRange.toString().length;
	}

	function restoreSelection(cursorPos: number) {
		if (isRestoring) return;
		isRestoring = true;

		// requestAnimationFrame(() => {
		// requestAnimationFrame(() => {
		const selection = window.getSelection();
		if (!selection) {
			isRestoring = false;
			return;
		}

		const range = document.createRange();
		let charCount = 0;
		let nodeStack: Node[] = [container];
		let node: Node | undefined;
		let foundStart = false;

		while ((node = nodeStack.pop())) {
			if (node.nodeType === Node.TEXT_NODE) {
				const textLength = node.textContent?.length || 0;
				const nextCharCount = charCount + textLength;

				if (!foundStart && cursorPos >= charCount && cursorPos <= nextCharCount) {
					try {
						const offset = Math.min(cursorPos - charCount, textLength);
						range.setStart(node, offset);
						range.collapse(true);
						foundStart = true;
						break;
					} catch (e) {
						console.warn('Failed to set range:', e);
					}
				}

				charCount = nextCharCount;
			} else {
				const children = Array.from(node.childNodes);
				for (let i = children.length - 1; i >= 0; i--) {
					nodeStack.push(children[i]);
				}
			}
		}

		if (foundStart) {
			try {
				selection.removeAllRanges();
				selection.addRange(range);
			} catch (e) {
				console.warn('Failed to restore selection:', e);
			}
		}

		isRestoring = false;
		// });
		// });
	}

	function highlightText() {
		if (!markInstance || isRestoring) return;

		const cursorPos = saveSelection();

		markInstance.unmark({
			done: () => {
				highlightTokens(cursorPos);
			}
		});
	}

	function highlightTokens(cursorPos: number) {
		let completed = 0;
		const totalPatterns = 5;

		function checkCompletion() {
			completed++;
			if (completed === totalPatterns) {
				restoreSelection(cursorPos);
			}
		}

		// 1. Math expressions (highest priority)
		markInstance.markRegExp(mathPattern, {
			className: 'token token-math',
			done: () => checkCompletion()
		});

		// 2. Participants
		markInstance.mark(participants, {
			className: 'token token-participant',
			separateWordSearch: true,
			accuracy: 'partially',
			caseSensitive: false,
			exclude: ['.token-math'],
			done: () => checkCompletion()
		});

		// 3. Items
		markInstance.mark(items, {
			className: 'token token-item',
			separateWordSearch: true,
			accuracy: 'partially',
			caseSensitive: false,
			exclude: ['.token-math', '.token-participant'],
			done: () => checkCompletion()
		});

		// 4. Actions
		markInstance.mark(actions, {
			className: 'token token-action',
			separateWordSearch: true,
			accuracy: 'partially',
			caseSensitive: false,
			exclude: ['.token-math', '.token-participant', '.token-item'],
			done: () => checkCompletion()
		});

		// 5. Adjectives
		markInstance.mark(adjectives, {
			className: 'token token-adjective',
			separateWordSearch: true,
			accuracy: 'partially',
			caseSensitive: false,
			exclude: ['.token-math', '.token-participant', '.token-item', '.token-action'],
			done: () => checkCompletion()
		});
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLDivElement;
		text = target.textContent || '';
		highlightText();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			// add a new line
		}
	}
</script>

<div
	bind:this={container}
	class="px-4 py-2 text-xl leading-8 focus:outline-none"
	contenteditable="true"
	role="textbox"
	tabindex={0}
	oninput={handleInput}
	onkeydown={handleKeydown}
	enterkeyhint="send"
></div>

<style>
	:global(.token) {
		padding: calc(var(--spacing) * 0.5);
		border-radius: var(--radius-sm);
	}
	:global(.token-math) {
		background-color: var(--color-secondary);
		color: var(--color-secondary-foreground);
	}

	:global(.token-participant) {
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
	}
	:global(.token-participant::before) {
		content: '@';
	}

	:global(.token-item) {
		background-color: var(--color-accent);
		color: var(--color-accent-foreground);
	}
	:global(.token-item::before) {
		content: '#';
	}

	:global(.token-action) {
		padding-inline: calc(var(--spacing) * 0);
		background-color: transparent;
		color: var(--color-chart-1);
	}

	:global(.token-adjective) {
		padding-inline: calc(var(--spacing) * 0);
		background-color: transparent;
		color: var(--color-chart-2);
	}
</style>
