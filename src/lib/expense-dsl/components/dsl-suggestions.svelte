<script lang="ts">
	import type { ParticipantContext, ExpenseAST } from '../parser/types';
	import * as DataList from '$lib/components/ui/data-list';
	import DslOption from './dsl-option.svelte';
	import VisualViewportView from '$lib/components/ui/visual-viewport-view/visual-viewport-view.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { getRankedSuggestions, shouldShowMathOperators } from '../utils/autocomplete';
	import { getCaretPosition } from '../utils/selection';
	import Plus from '@tabler/icons-svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import X from '@lucide/svelte/icons/x';
	import Divide from '@lucide/svelte/icons/divide';
	import Percent from '@lucide/svelte/icons/percent';
	import BracketOpen from '$lib/components/icons/bracket-open.svelte';
	import BracketClose from '$lib/components/icons/bracket-close.svelte';

	interface Props {
		inputId: string;
		context: ParticipantContext;
		ast: ExpenseAST | null;
		showMath: boolean;
	}

	let { inputId, context, ast, showMath }: Props = $props();

	let suggestions = $derived.by(() => {
		if (typeof document === 'undefined') return [];

		const input = document.getElementById(inputId);
		if (!input) return [];

		const text = input.textContent || '';
		const caretPos = getCaretPosition(input as HTMLElement);

		return getRankedSuggestions(ast, text, caretPos, context, showMath);
	});
</script>

<VisualViewportView forceOverlaysContent>
	<DataList.Root
		{inputId}
		class="absolute inset-0 top-auto flex h-12 items-start gap-3 overflow-auto border-t border-border bg-background px-3 py-1 text-foreground"
	>
		{#if showMath}
			<DataList.Option value="+">
				<Badge class="rounded-full p-2 px-3"><Plus /></Badge>
			</DataList.Option>
			<DataList.Option value="-">
				<Badge class="rounded-full p-2 px-3"><Minus /></Badge>
			</DataList.Option>
			<DataList.Option value="*">
				<Badge class="rounded-full p-2 px-3"><X /></Badge>
			</DataList.Option>
			<DataList.Option value="/">
				<Badge class="rounded-full p-2 px-3"><Divide /></Badge>
			</DataList.Option>
			<DataList.Option value="%">
				<Badge class="rounded-full p-2 px-3"><Percent /></Badge>
			</DataList.Option>
			<DataList.Option value="(">
				<Badge class="rounded-full p-2 px-3"><BracketOpen /></Badge>
			</DataList.Option>
			<DataList.Option value=")">
				<Badge class="rounded-full p-2 px-3"><BracketClose /></Badge>
			</DataList.Option>
		{:else}
			{#each suggestions as suggestion}
				<DslOption
					value={suggestion.value}
					styledValue={suggestion.html
						? {
								html: suggestion.html + ' ',
								text: suggestion.value
							}
						: undefined}
				>
					{suggestion.label}
				</DslOption>
			{/each}
		{/if}
	</DataList.Root>
</VisualViewportView>
