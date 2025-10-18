<script lang="ts">
	import { KeyboardAwareView, VisualViewportView } from '$lib/components/ui/view';
	import * as DataList from '$lib/components/ui/data-list';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import X from '@lucide/svelte/icons/x';
	import Divide from '@lucide/svelte/icons/divide';
	import Percent from '@lucide/svelte/icons/percent';
	import BracketOpen from '$lib/components/icons/bracket-open.svelte';
	import BracketClose from '$lib/components/icons/bracket-close.svelte';
	import Parentheses from '@tabler/icons-svelte/icons/parentheses';
	import { VIBRATE_DURATION } from '$lib/constants';
	import { cn } from '$lib/utils';
	import { EmblaScrollArea } from '$lib/components/ui/embla-scroll-area';
	import { onMount, onDestroy } from 'svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let hasSelection = $state(false);
	let savedSelectionText = $state('');

	function updateSelectionState() {
		const selection = window.getSelection();
		const selectedText = selection?.toString() || '';

		hasSelection = selectedText.length > 0;
		savedSelectionText = selectedText;
	}

	onMount(() => {
		document.addEventListener('selectionchange', updateSelectionState);
		updateSelectionState();
	});

	onDestroy(() => {
		document.removeEventListener('selectionchange', updateSelectionState);
	});

	const keys = [
		{
			icon: Plus,
			show: () => true,
			onDown: createKeyDownHandler('+'),
			onSelect: createKeySelectHandler('+')
		},
		{
			icon: X,
			show: () => true,
			onDown: createKeyDownHandler('*'),
			onSelect: createKeySelectHandler('*')
		},
		{
			icon: Percent,
			show: () => true,
			onDown: createKeyDownHandler('%'),
			onSelect: createKeySelectHandler('%')
		},
		{
			icon: Minus,
			show: () => true,
			onDown: createKeyDownHandler('-'),
			onSelect: createKeySelectHandler('-')
		},
		{
			icon: Divide,
			show: () => true,
			onDown: createKeyDownHandler('/'),
			onSelect: createKeySelectHandler('/')
		},
		{
			icon: BracketOpen,
			show: () => true,
			onDown: createKeyDownHandler('('),
			onSelect: createKeySelectHandler('(')
		},
		{
			icon: BracketClose,
			show: () => true,
			onDown: createKeyDownHandler(')'),
			onSelect: createKeySelectHandler(')')
		},
		{
			icon: Parentheses,
			show: () => hasSelection,
			onDown: (e: Event) => {
				navigator.vibrate(VIBRATE_DURATION);
				const selection = window.getSelection();
				savedSelectionText = selection?.toString() || '';
			},
			onSelect: (e: Event) => {
				if (!savedSelectionText) return;
				document.execCommand('insertText', false, `(${savedSelectionText})`);
			}
		}
	];

	function createKeyDownHandler(symbol: string) {
		return (e: Event) => {
			navigator.vibrate(VIBRATE_DURATION);
			updateSelectionState();
		};
	}

	function createKeySelectHandler(symbol: string) {
		return (e: Event) => {
			document.execCommand('insertText', false, symbol);
		};
	}
</script>

<!-- <VisualViewportView>
	{#snippet children(viewport)}
		{@const inverseScale = 1 / viewport.scale}
		<DataList.Root
			bind:open
			class={cn(
				'absolute inset-x-0 bottom-0',
				'border-t border-border bg-background py-1 text-foreground',
				'origin-bottom-left'
			)}
			style="
                transform: scale({inverseScale});
				width: {viewport.width * viewport.scale}px;
                transform-origin: bottom left;
            "
		>
			<EmblaScrollArea class="h-full py-1" containerClass="flex items-center gap-2 px-2">
				{#each keys as key}
					{@const Icon = key.icon}
					{#if key.show()}
						<DataList.Option
							class="flex-shrink-0 rounded-full bg-primary p-2 px-3 text-primary-foreground active:bg-accent active:text-accent-foreground"
							onDown={key.onDown}
							onSelect={key.onSelect}
						>
							<Icon style="width: 24px; height: 20px;" />
						</DataList.Option>
					{/if}
				{/each}
			</EmblaScrollArea>
		</DataList.Root>
	{/snippet}
</VisualViewportView> -->

<KeyboardAwareView>
	<DataList.Root
		bind:open
		class={cn('absolute inset-x-0 bottom-0', 'border-t-2 border-border py-1', 'text-foreground')}
	>
		<div role="presentation" class="absolute top-0 h-screen w-full bg-background"></div>
		<EmblaScrollArea class="h-full py-1" containerClass="flex items-center gap-2 px-2">
			{#each keys as key}
				{@const Icon = key.icon}
				{#if key.show()}
					<DataList.Option
						class="flex-shrink-0 rounded-full bg-primary p-2 px-3 text-primary-foreground active:bg-accent active:text-accent-foreground"
						onDown={key.onDown}
						onSelect={key.onSelect}
					>
						<Icon style="width: 24px; height: 20px;" />
					</DataList.Option>
				{/if}
			{/each}
		</EmblaScrollArea>
	</DataList.Root>
</KeyboardAwareView>
