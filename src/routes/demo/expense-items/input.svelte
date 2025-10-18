<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { Extension } from '@tiptap/core';
	import { Plugin, PluginKey } from '@tiptap/pm/state';
	import { Decoration, DecorationSet } from '@tiptap/pm/view';
	import Document from '@tiptap/extension-document';
	import Paragraph from '@tiptap/extension-paragraph';
	import Text from '@tiptap/extension-text';
	import Placeholder from '@tiptap/extension-placeholder';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import X from '@lucide/svelte/icons/x';
	import Divide from '@lucide/svelte/icons/divide';
	import Percent from '@lucide/svelte/icons/percent';
	import BracketOpen from '$lib/components/icons/bracket-open.svelte';
	import BracketClose from '$lib/components/icons/bracket-close.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { VIBRATE_DURATION } from '$lib/constants';
	import { mathPattern } from '../math-regex';
	import { KeyboardAwareView } from '$lib/components/ui/view';

	// DSL context
	const participants = ['alice', 'bob', 'charlie', 'david'];
	const items = ['coffee', 'lunch', 'dinner', 'taxi', 'groceries', 'chicken tandoori'];
	const actions = ['split', 'splits', 'pays', 'paid', 'owes', 'owed'];
	const adjectives = ['equally', 'evenly', 'proportionally', 'percentage', 'shares'];

	const preMathActions = ['pays', 'paid', 'owes', 'owed'];
	const currencySymbol = 'Rs';

	// Create custom extension with ProseMirror plugin for auto-highlighting
	const AutoHighlight = Extension.create({
		name: 'autoHighlight',

		addProseMirrorPlugins() {
			return [
				new Plugin({
					key: new PluginKey('autoHighlight'),
					state: {
						init(_, { doc }) {
							return findTokens(doc);
						},
						apply(transaction, oldState) {
							return transaction.docChanged ? findTokens(transaction.doc) : oldState;
						}
					},
					props: {
						decorations(state) {
							return this.getState(state);
						}
					}
				})
			];
		}
	});

	function findTokens(doc: any): DecorationSet {
		const decorations: any[] = [];

		doc.descendants((node: any, position: number) => {
			if (!node.isText) return;

			const text = node.text;
			if (!text) return;

			let match;

			// 1. Math expressions (highest priority)
			const mathMatches: Array<{ from: number; to: number; hasPrefix: boolean }> = [];
			const mathRegex = new RegExp(mathPattern, 'g');

			while ((match = mathRegex.exec(text)) !== null) {
				const localFrom = match.index;
				const localTo = localFrom + match[0].length;
				const hasPrefix = localFrom > 0 && text[localFrom - 1] === currencySymbol;
				const actualLocalFrom = hasPrefix ? localFrom - 1 : localFrom;
				mathMatches.push({
					from: position + actualLocalFrom,
					to: position + localTo,
					hasPrefix
				});
			}

			mathMatches.forEach(({ from, to, hasPrefix }) => {
				decorations.push(
					Decoration.inline(from, to, {
						class: `token token-math${hasPrefix ? ' has-prefix' : ''}`
					})
				);
			});

			// Helper to check if position overlaps with math
			const isInMath = (start: number, end: number) => {
				return mathMatches.some(
					(m) =>
						(start >= m.from && start < m.to) ||
						(end > m.from && end <= m.to) ||
						(start <= m.from && end >= m.to)
				);
			};

			// 2. Participants
			participants.forEach((participant) => {
				const regex = new RegExp(`\\b${participant}\\b`, 'gi');
				while ((match = regex.exec(text)) !== null) {
					const localFrom = match.index;
					const localTo = localFrom + match[0].length;
					const hasPrefix = localFrom > 0 && text[localFrom - 1] === '@';
					const actualLocalFrom = hasPrefix ? localFrom - 1 : localFrom;
					const actualFrom = position + actualLocalFrom;
					const to = position + localTo;

					if (isInMath(actualFrom, to)) continue;

					decorations.push(
						Decoration.inline(actualFrom, to, {
							class: `token token-participant${hasPrefix ? ' has-prefix' : ''}`
						})
					);
				}
			});

			// 3. Items
			items.forEach((item) => {
				const regex = new RegExp(`\\b${item}\\b`, 'gi');
				while ((match = regex.exec(text)) !== null) {
					const localFrom = match.index;
					const localTo = localFrom + match[0].length;
					const hasPrefix = localFrom > 0 && text[localFrom - 1] === '#';
					const actualLocalFrom = hasPrefix ? localFrom - 1 : localFrom;
					const actualFrom = position + actualLocalFrom;
					const to = position + localTo;

					if (isInMath(actualFrom, to)) continue;

					decorations.push(
						Decoration.inline(actualFrom, to, {
							class: `token token-item${hasPrefix ? ' has-prefix' : ''}`
						})
					);
				}
			});

			// 4. Actions
			actions.forEach((action) => {
				const regex = new RegExp(`\\b${action}\\b`, 'gi');
				while ((match = regex.exec(text)) !== null) {
					const localFrom = match.index;
					const localTo = localFrom + match[0].length;
					const from = position + localFrom;
					const to = position + localTo;

					if (isInMath(from, to)) continue;

					decorations.push(
						Decoration.inline(from, to, {
							class: 'token token-action'
						})
					);
				}
			});

			// 5. Adjectives
			adjectives.forEach((adjective) => {
				const regex = new RegExp(`\\b${adjective}\\b`, 'gi');
				while ((match = regex.exec(text)) !== null) {
					const localFrom = match.index;
					const localTo = localFrom + match[0].length;
					const from = position + localFrom;
					const to = position + localTo;

					if (isInMath(from, to)) continue;

					decorations.push(
						Decoration.inline(from, to, {
							class: 'token token-adjective'
						})
					);
				}
			});
		});

		return DecorationSet.create(doc, decorations);
	}

	let element: HTMLElement | undefined = $state();
	let editor: Editor | undefined = $state();

	// Suggestion state
	let suggestionType = $state<'none' | 'math' | 'autocomplete' | 'range'>('none');
	let autocompleteMatches = $state<string[]>([]);
	let currentWordStart = $state(0);

	// Input mode state
	let inputMode = $state<'text' | 'numeric'>('text');

	// Debug states
	let lastWord = $state('');
	let currentWord = $state('');
	let cursorTokenType = $state('none');
	let expectingMath = $state(false);
	let inMath = $state(false);

	function updateSuggestionsAndInputMode() {
		if (!editor) return;
		const { state, view } = editor;
		const selection = state.selection;
		const { from, to } = selection;

		// Check if selection is a range
		if (from !== to) {
			suggestionType = 'range';
			inputMode = 'text';
			element?.setAttribute('inputmode', inputMode);
			autocompleteMatches = [];
			lastWord = '';
			currentWord = '';
			cursorTokenType = 'none';
			expectingMath = false;
			inMath = false;
			return;
		}

		// Detect cursorTokenType and inMath using DOM inspection
		cursorTokenType = 'none';
		inMath = false;

		const findClosestTokenElement = (from: number): Element | null => {
			const domAtPos = view.domAtPos(from);
			let currentNode = domAtPos.node;
			while (currentNode && currentNode.parentNode) {
				if (currentNode.nodeType === Node.ELEMENT_NODE) {
					const element = currentNode as Element;
					if (element.classList && element.classList.contains('token')) {
						return element;
					}
				}
				currentNode = currentNode.parentNode;
			}
			return null;
		};

		const getTokenType = (element: Element | null) => {
			if (!element) return null;
			if (element.classList.contains('token-math')) return 'math';
			if (element.classList.contains('token-participant')) return 'participant';
			if (element.classList.contains('token-item')) return 'item';
			if (element.classList.contains('token-action')) return 'action';
			if (element.classList.contains('token-adjective')) return 'adjective';
			return null;
		};

		const tokenElementLeft = getTokenType(findClosestTokenElement(from - 1));
		const tokenElementCenter = getTokenType(findClosestTokenElement(from));
		const tokenElementRight = getTokenType(findClosestTokenElement(from + 1));
		const abc = [tokenElementLeft, tokenElementCenter, tokenElementRight];
		abc.forEach((tokenType) => {
			if (tokenType === 'math') {
				cursorTokenType = 'math';
				inMath = true;
			}
		});
		type TokenType = 'participant' | 'item' | 'action' | 'adjective';
		const nonMath = abc.filter(
			(tokenType) => tokenType !== 'math' && tokenType !== null
		) as TokenType[];

		if (nonMath.length > 0) {
			cursorTokenType = nonMath[0];
			inMath = false;
		}

		// Check if after space
		const prevCharPos = from > 0 ? from - 1 : -1;
		const prevChar = prevCharPos >= 0 ? state.doc.textBetween(prevCharPos, from) : '';
		const isAfterSpace = prevChar === ' ';

		// Compute lastWord if after space
		let computedLastWord = '';
		if (isAfterSpace) {
			let lastWordStart = from - 1;
			while (lastWordStart > 0) {
				const prevC = state.doc.textBetween(lastWordStart - 1, lastWordStart);
				if (prevC === ' ') break;
				lastWordStart--;
			}
			computedLastWord = state.doc
				.textBetween(lastWordStart, from - 1)
				.trim()
				.toLowerCase();
		}
		lastWord = computedLastWord;

		// Compute currentWord and wordStart if not after space (for autocomplete)
		let computedCurrentWord = '';
		let computedCurrentWordStart = from;
		if (!isAfterSpace) {
			let wordStart = from;
			while (wordStart > 0) {
				const char = state.doc.textBetween(wordStart - 1, wordStart);
				if (!char.match(/[\w@#]/)) break;
				wordStart--;
			}
			computedCurrentWord = state.doc.textBetween(wordStart, from).toLowerCase();
			computedCurrentWordStart = wordStart;
		}
		currentWord = computedCurrentWord;
		currentWordStart = computedCurrentWordStart;

		//try to match math
		const mathMatch = currentWord.match(mathPattern);
		if (mathMatch) {
			inMath = true;
			cursorTokenType = 'math';
			inMath = true;
		}

		// Expecting math after pre-math action
		expectingMath = isAfterSpace && preMathActions.includes(lastWord);

		// Update input mode
		inputMode = inMath || expectingMath ? 'numeric' : 'text';
		element?.setAttribute('inputmode', inputMode);

		// Update suggestions
		suggestionType = 'none';
		autocompleteMatches = [];

		if (expectingMath || inMath) {
			suggestionType = 'math';
		} else if (currentWord.length > 0) {
			suggestionType = 'autocomplete';
			// Compute lastTokenType based on lastWord
			let lastTokenType = 'none';
			if (lastWord) {
				if (participants.includes(lastWord)) lastTokenType = 'participant';
				else if (items.includes(lastWord)) lastTokenType = 'item';
				else if (actions.includes(lastWord)) lastTokenType = 'action';
				else if (adjectives.includes(lastWord)) lastTokenType = 'adjective';
			}
			// Compute matches with proper prefixes
			let matches = [];

			if (currentWord.startsWith('@')) {
				// Participant autocomplete
				const query = currentWord.slice(1).toLowerCase();
				matches = participants.filter((p) => p.toLowerCase().startsWith(query)).map((p) => '@' + p);
			} else if (currentWord.startsWith('#')) {
				// Item autocomplete
				const query = currentWord.slice(1).toLowerCase();
				matches = items.filter((i) => i.toLowerCase().startsWith(query)).map((i) => '#' + i);
			} else {
				// General autocomplete without prefix
				const allWords = [...participants, ...items, ...actions, ...adjectives];
				matches = allWords.filter((w) => w.toLowerCase().startsWith(currentWord));
			}

			if (lastTokenType !== 'none' && matches.length > 0) {
				let priorityWords: string[];
				switch (lastTokenType) {
					case 'participant':
						priorityWords = participants;
						break;
					case 'item':
						priorityWords = items;
						break;
					case 'action':
						priorityWords = actions;
						break;
					case 'adjective':
						priorityWords = adjectives;
						break;
					default:
						priorityWords = [];
				}
				matches = matches.sort((a, b) => {
					const aPrio = priorityWords.includes(a) ? 0 : 1;
					const bPrio = priorityWords.includes(b) ? 0 : 1;
					return aPrio - bPrio;
				});
			}
			autocompleteMatches = matches;
		}
	}

	function selectSuggestion(value: string) {
		if (!editor) return;

		navigator.vibrate(VIBRATE_DURATION);

		const { state } = editor;
		const head = state.selection.head;

		if (suggestionType === 'autocomplete') {
			// Compute word start fresh to avoid state staleness
			let wordStart = head;
			while (wordStart > 0) {
				const char = state.doc.textBetween(wordStart - 1, wordStart);
				if (!char.match(/[\w@#]/)) break;
				wordStart--;
			}
			// Delete the partial word and insert the full suggestion
			editor
				.chain()
				.focus()
				.deleteRange({ from: wordStart, to: head })
				.insertContent(value + ' ') // Add space after insertion for UX
				.run();
		} else {
			editor.chain().focus().insertContent(value).run();
		}
	}

	function handlePointerdown(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		// to stop the actual activeElement to loose focus
	}

	let hasSuggestions = $derived(suggestionType !== 'none');

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [
				Document,
				Paragraph,
				Text,
				AutoHighlight,
				Placeholder.configure({
					placeholder: ({ node, pos }) => {
						const lineNumber = editor?.state.doc.resolve(pos).node().childCount || 0;
						console.log(lineNumber);
						if (lineNumber === 1) {
							// Pick random participant
							const randomParticipant = participants[0];
							return `@${randomParticipant} paid ${currencySymbol}100+5% tax`;
						} else if (lineNumber === 2) {
							// Pick random item and participant
							const randomItem = items[Math.floor(Math.random() * items.length)];
							return `#${randomItem} for ${currencySymbol}10.50`;
						} else {
							return `remaining ${currencySymbol}10.50`;
						}
					},
					showOnlyCurrent: false,
					includeChildren: true
				})
			],
			content: '<p></p>'
		});

		editor.on('update', updateSuggestionsAndInputMode);
		editor.on('selectionUpdate', updateSuggestionsAndInputMode);
		updateSuggestionsAndInputMode(); // Initial call
	});

	$effect(() => {
		// sett css variable currency symbol
		element?.style.setProperty('--currency-symbol', `"${currencySymbol}"`);
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	$effect(() => {
		if (editor?.view.dom) {
			const editorElement = editor.view.dom as HTMLElement;
			editorElement.setAttribute('inputmode', inputMode);
		}
	});
</script>

<div bind:this={element} class="editor-container" role="textbox" tabindex={0}></div>
<span>
	<p>hasSuggestions:{hasSuggestions}</p>
	<p>suggestionType:{suggestionType}</p>
	<p>lastWord:{lastWord}</p>
	<p>currentWord:{currentWord}</p>
	<p>cursorTokenType:{cursorTokenType}</p>
	<p>expectingMath:{expectingMath}</p>
	<p>inMath:{inMath}</p>
	<p>inputMode:{inputMode}</p>
</span>

<KeyboardAwareView>
	{#if hasSuggestions}
		<div
			class="absolute inset-0 top-auto flex h-12 items-start gap-3 overflow-auto border-t border-border bg-background px-3 py-1 text-foreground"
		>
			{#if suggestionType === 'math'}
				<button onpointerdown={handlePointerdown} onclick={() => selectSuggestion('+')}>
					<Badge class="rounded-full p-2 px-3">
						<Plus />
					</Badge>
				</button>
				<button onpointerdown={handlePointerdown} onclick={() => selectSuggestion('-')}>
					<Badge class="rounded-full p-2 px-3">
						<Minus />
					</Badge>
				</button>
				<button onpointerdown={handlePointerdown} onclick={() => selectSuggestion('*')}>
					<Badge class="rounded-full p-2 px-3">
						<X />
					</Badge>
				</button>
				<button onpointerdown={handlePointerdown} onclick={() => selectSuggestion('/')}>
					<Badge class="rounded-full p-2 px-3">
						<Divide />
					</Badge>
				</button>
				<button onpointerdown={handlePointerdown} onclick={() => selectSuggestion('%')}>
					<Badge class="rounded-full p-2 px-3">
						<Percent />
					</Badge>
				</button>
				<button onpointerdown={handlePointerdown} onclick={() => selectSuggestion('(')}>
					<Badge class="rounded-full p-2 px-3">
						<BracketOpen />
					</Badge>
				</button>
				<button onpointerdown={handlePointerdown} onclick={() => selectSuggestion(')')}>
					<Badge class="rounded-full p-2 px-3">
						<BracketClose />
					</Badge>
				</button>
			{/if}

			{#if suggestionType === 'autocomplete'}
				{#each autocompleteMatches as match}
					<button onpointerdown={handlePointerdown} onclick={() => selectSuggestion(match)}>
						<Badge variant="outline" class="rounded-full p-2 px-3">
							{match}
						</Badge>
					</button>
				{/each}
			{/if}

			{#if suggestionType === 'range'}
				<!-- Placeholder for range suggestions; expand as needed -->
				<button
					onpointerdown={handlePointerdown}
					onclick={() => {
						if (editor) {
							editor.chain().focus().deleteSelection().run();
							suggestionType = 'none';
						}
					}}
				>
					<Badge variant="destructive" class="rounded-full p-2 px-3">Delete Range</Badge>
				</button>
			{/if}
		</div>
	{/if}
</KeyboardAwareView>

<style>
	.editor-container :global(.tiptap) {
		padding: 1rem;
		font-size: 1.25rem;
		line-height: 2rem;
		min-height: 200px;
	}

	.editor-container :global(.tiptap:focus) {
		outline: none;
	}

	:global(.token) {
		padding: calc(var(--spacing, 0.25rem) * 0.5);
		border-radius: var(--radius-sm, 4px);
	}

	:global(.token-math) {
		background-color: var(--color-secondary);
		color: var(--color-secondary-foreground);
	}

	:global(.token-math::before) {
		content: var(--currency-symbol);
	}

	:global(.token-math.has-prefix::before) {
		content: '';
	}

	:global(.token-participant),
	:global(.token-participant.has-prefix) {
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	:global(.token-participant::before) {
		content: '@';
	}

	:global(.token-participant.has-prefix::before) {
		content: '';
	}

	:global(.token-item),
	:global(.token-item.has-prefix) {
		background-color: var(--color-accent);
		color: var(--color-accent-foreground);
	}

	:global(.token-item::before) {
		content: '#';
	}

	:global(.token-item.has-prefix::before) {
		content: '';
	}

	:global(.token-action) {
		padding-inline: calc(var(--spacing, 0.25rem) * 0);
		background-color: transparent;
		text-decoration: underline;
		/* color: var(--color-chart-1); */
	}

	:global(.token-adjective) {
		padding-inline: calc(var(--spacing, 0.25rem) * 0);
		background-color: transparent;
		text-decoration: underline;
		/* color: var(--color-chart-2); */
	}

	.editor-container :global(.tiptap p.is-empty::before) {
		color: #adb5bd;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	.editor-container :global(.tiptap p.is-editor-empty:first-child::before) {
		color: #adb5bd;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
</style>
