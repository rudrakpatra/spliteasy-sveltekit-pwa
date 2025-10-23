<script lang="ts">
	import { KeyboardAwareView } from '$lib/components/ui/view';
	import * as DataList from '$lib/components/ui/data-list';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import X from '@lucide/svelte/icons/x';
	import Divide from '@lucide/svelte/icons/divide';
	import Percent from '@lucide/svelte/icons/percent';
	import BracketOpen from '$lib/components/icons/bracket-open.svelte';
	import BracketClose from '$lib/components/icons/bracket-close.svelte';
	import Parentheses from '@tabler/icons-svelte/icons/parentheses';
	import Sum from '@tabler/icons-svelte/icons/sum';
	import { VIBRATE_DURATION } from '$lib/constants';
	import { EmblaScrollArea } from '$lib/components/ui/embla-scroll-area';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { getExpenseFormContext } from '../context.svelte';
	import { evaluate } from '$lib/shared/schema/math';
	import { Button } from '$lib/components/ui/button';

	const api = trpc(page);

	const ctx = getExpenseFormContext();
	const { form } = ctx;
	const { form: formData } = form;

	// Generate unique IDs
	function generateId() {
		return crypto.randomUUID().slice(0, 6);
	}

	// Helper function for clean updates
	function updateFormData(updater: (snapshot: typeof $formData) => void) {
		const snapshot = $state.snapshot($formData);
		updater(snapshot);
		formData.set(snapshot);
	}

	let { open = $bindable(false), id }: { open: boolean; id: string } = $props();

	let hasSelection = $state(false);
	let savedSelectionText = $state('');

	function updateSelectionState() {
		if (!browser) return;
		const selection = window.getSelection();
		const selectedText = selection?.toString() || '';

		hasSelection = selectedText.length > 0;
		savedSelectionText = selectedText;
	}

	onMount(() => {
		if (!browser) return;
		document.addEventListener('selectionchange', updateSelectionState);
		updateSelectionState();
	});

	onDestroy(() => {
		if (!browser) return;
		document.removeEventListener('selectionchange', updateSelectionState);
	});

	const keys = [
		{
			id: 'plus',
			icon: Plus,
			get show() {
				return true;
			},
			onDown: createKeyDownHandler('+'),
			onClick: createKeyClickHandler('+')
		},
		{
			id: 'multiply',
			icon: X,
			get show() {
				return true;
			},
			onDown: createKeyDownHandler('*'),
			onClick: createKeyClickHandler('*')
		},
		{
			id: 'percent',
			icon: Percent,
			get show() {
				return true;
			},
			onDown: createKeyDownHandler('%'),
			onClick: createKeyClickHandler('%')
		},
		{
			id: 'minus',
			icon: Minus,
			get show() {
				return true;
			},
			onDown: createKeyDownHandler('-'),
			onClick: createKeyClickHandler('-')
		},
		{
			id: 'divide',
			icon: Divide,
			get show() {
				return true;
			},
			onDown: createKeyDownHandler('/'),
			onClick: createKeyClickHandler('/')
		},
		{
			icon: BracketOpen,
			get show() {
				return true;
			},
			onDown: createKeyDownHandler('('),
			onClick: createKeyClickHandler('(')
		},
		{
			id: 'bracket-close',
			icon: BracketClose,
			get show() {
				return true;
			},
			onDown: createKeyDownHandler(')'),
			onClick: createKeyClickHandler(')')
		},
		{
			id: 'parentheses',
			icon: Parentheses,
			get label() {
				return 'Wrap in Parentheses';
			},
			get show() {
				return hasSelection;
			},
			onDown: (e: Event) => {
				navigator.vibrate(VIBRATE_DURATION);
				const selection = window.getSelection();
				savedSelectionText = selection?.toString() || '';
			},
			onClick: (e: Event) => {
				if (!savedSelectionText) return;
				document.execCommand('insertText', false, `(${savedSelectionText})`);
			}
		}
		// {
		// 	id: 'sum',
		// 	icon: Sum,
		// 	get label() {
		// 		return `Total: ${getSum()}`;
		// 	},
		// 	get show() {
		// 		return getSum();
		// 	},
		// 	onDown: createKeyDownHandler('sum'),
		// 	onClick: createKeyClickHandler(getSum().toString())
		// }
	];

	// function getSum() {
	// 	if ($formData.splitData.type !== 'ITEMS') return 0;
	// 	if (ctx.items.selected.size > 0) {
	// 		//only selected items
	// 	}
	// 	return $formData.splitData.items.reduce((acc, item) => {
	// 		const amount = evaluate(item.amountExpression);
	// 		if (!amount || isNaN(amount)) {
	// 			throw new Error('Invalid amount');
	// 		}
	// 		return acc + amount;
	// 	}, 0);
	// }

	function createKeyDownHandler(symbol: string) {
		return (e: Event) => {
			e.preventDefault();
			e.stopPropagation();
			navigator.vibrate(VIBRATE_DURATION);
			updateSelectionState();
		};
	}

	function createKeyClickHandler(symbol: string) {
		return (e: Event) => {
			e.preventDefault();
			e.stopPropagation();

			document.execCommand('insertText', false, symbol);
		};
	}
</script>

<KeyboardAwareView>
	<DataList.Portal bind:open id={`calculator-${id}`}>
		<!-- backdrop -->
		<div class="absolute top-0 h-full w-full border-t-1 border-border bg-background py-1"></div>
		<!-- scroll area -->
		<EmblaScrollArea class="h-full py-1" containerClass="flex items-center gap-2 px-2">
			{#each keys as key (key.id)}
				{@const Icon = key.icon}
				{#if key.show}
					<Button
						class="rounded-full active:bg-accent active:text-accent-foreground"
						onpointerdown={key.onDown}
						onclick={key.onClick}
					>
						<Icon style="width: 24px; height: 20px;" />{key.label}
					</Button>
				{/if}
			{/each}
		</EmblaScrollArea>
	</DataList.Portal>
</KeyboardAwareView>
