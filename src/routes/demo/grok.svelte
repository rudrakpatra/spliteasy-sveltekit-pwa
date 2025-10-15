<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { Extension } from '@tiptap/core';
	import { Plugin, PluginKey } from '@tiptap/pm/state';
	import { Decoration, DecorationSet } from '@tiptap/pm/view';
	import Document from '@tiptap/extension-document';
	import Paragraph from '@tiptap/extension-paragraph';
	import Text from '@tiptap/extension-text';
	import { mathPattern } from './math-regex';

	// DSL context
	const participants = ['alice', 'bob', 'charlie', 'david'];
	const items = ['coffee', 'lunch', 'dinner', 'taxi', 'groceries'];
	const actions = ['split', 'splits', 'pays', 'paid', 'owes', 'owed'];
	const adjectives = ['equally', 'evenly', 'proportionally', 'percentage', 'shares'];

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
				const hasPrefix = localFrom > 0 && text[localFrom - 1] === '$';
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

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [Document, Paragraph, Text, AutoHighlight],
			content: '<p>alice paid $50 for coffee and bob splits equally</p>'
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});
</script>

<div bind:this={element} class="editor-container" role="textbox" tabindex={0}></div>

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
		content: '$';
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
</style>
