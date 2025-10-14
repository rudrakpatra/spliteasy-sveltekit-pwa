<script lang="ts">
	import Plus from '@tabler/icons-svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import X from '@lucide/svelte/icons/x';
	import Divide from '@lucide/svelte/icons/divide';
	import Percent from '@lucide/svelte/icons/percent';
	import VisualViewportView from '$lib/components/ui/visual-viewport-view/visual-viewport-view.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import ArrowRight from '@tabler/icons-svelte/icons/arrow-right';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import * as DataList from '$lib/components/ui/data-list';
	import BracketOpen from '$lib/components/icons/bracket-open.svelte';
	import BracketClose from '$lib/components/icons/bracket-close.svelte';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Select from '$lib/components/ui/select';
	import ChartPie from '@tabler/icons-svelte/icons/chart-pie';
	import ChartPieFilled from '@tabler/icons-svelte/icons/chart-pie-filled';
	import { Label } from '$lib/components/ui/label';
	import Square from '@tabler/icons-svelte/icons/square';
	import SquareCheck from '@tabler/icons-svelte/icons/square-check';
	import SquareCheckFilled from '@tabler/icons-svelte/icons/square-check-filled';
	import TrashFilled from '@tabler/icons-svelte/icons/trash-filled';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import { VIBRATE_DURATION } from '$lib/constants';
	import { Button } from '$lib/components/ui/button';
	import Dots from '@tabler/icons-svelte/icons/dots';
	import { Textarea } from '$lib/components/ui/textarea';

	// Reactive data structure
	let data = $state({
		participants: ['rudrak', 'roopak', 'raunaque', 'alice', 'bob', 'charlie'],
		items: [
			{
				id: crypto.randomUUID(),
				name: 'Water',
				nameEl: null as HTMLInputElement | null,
				amount: '50.00',
				amountEl: null as HTMLInputElement | null,
				shares: ['1', '1', '1', '1', '1', '1']
			},
			{
				id: crypto.randomUUID(),
				name: 'Burger',
				nameEl: null as HTMLInputElement | null,
				amount: '150.00',
				amountEl: null as HTMLInputElement | null,
				shares: ['1', '', '', '', '', '']
			}
		],
		paid: ['1', '', '', '', '', '']
	});

	let activeElement = $state(null as Element | null);

	$effect(() => {
		if (typeof document === 'undefined') return;
		const setActiveElement = () => {
			activeElement = document.activeElement;
		};
		setActiveElement();
		// Listen for focus/blur events on the document
		document.addEventListener('focusin', setActiveElement);
		document.addEventListener('focusout', setActiveElement);

		return () => {
			document.removeEventListener('focusin', setActiveElement);
			document.removeEventListener('focusout', setActiveElement);
		};
	});

	let participants = $state(['rudrak', 'roopak', 'raunaque', 'alice', 'bob', 'charlie']);

	let showMath = $state(false);
	let showCommands = $state(true);
</script>

<Textarea id="expense-dsl" />
<VisualViewportView forceOverlaysContent>
	<DataList.Root
		inputId="expense-dsl"
		class="absolute inset-0 top-auto flex h-12 items-start gap-3 overflow-auto border-t border-border bg-background px-3 py-1 text-foreground"
	>
		{#if showMath}
			<DataList.Option value="+">
				<Badge class="rounded-full p-2 px-3">
					<Plus />
				</Badge>
			</DataList.Option>
			<DataList.Option value="-">
				<Badge class="rounded-full p-2 px-3">
					<Minus />
				</Badge>
			</DataList.Option>
			<DataList.Option value="*">
				<Badge class="rounded-full p-2 px-3">
					<X />
				</Badge>
			</DataList.Option>
			<DataList.Option value="/">
				<Badge class="rounded-full p-2 px-3">
					<Divide />
				</Badge>
			</DataList.Option>
			<DataList.Option value="%">
				<Badge class="rounded-full p-2 px-3">
					<Percent />
				</Badge>
			</DataList.Option>
			<DataList.Option value="(">
				<Badge class="rounded-full p-2 px-3">
					<BracketOpen />
				</Badge>
			</DataList.Option>
			<DataList.Option value=")">
				<Badge class="rounded-full p-2 px-3">
					<BracketClose />
				</Badge>
			</DataList.Option>
			<DataList.Option
				onSelect={({ inputElement }) => {
					const from = inputElement.selectionStart ?? 0;
					const to = Math.max(0, from - 1);
					inputElement.setSelectionRange(to, to);
					navigator.vibrate(VIBRATE_DURATION);
					inputElement.dispatchEvent(new Event('input', { bubbles: true }));
				}}
			>
				<Badge class="rounded-full p-2 px-3">
					<ArrowLeft />
				</Badge>
			</DataList.Option>
			<DataList.Option
				onSelect={({ inputElement }) => {
					const from = inputElement.selectionStart ?? 0;
					const to = Math.min(inputElement.value.length, from + 1);
					inputElement.setSelectionRange(to, to);
					navigator.vibrate(VIBRATE_DURATION);
					inputElement.dispatchEvent(new Event('input', { bubbles: true }));
				}}
			>
				<Badge class="rounded-full p-2 px-3">
					<ArrowRight />
				</Badge>
			</DataList.Option>
		{/if}
		{#if showCommands}
			<DataList.Option value="Add ">Add</DataList.Option>
			<DataList.Option value=" for ">for</DataList.Option>
			<DataList.Option value="Split ">Split</DataList.Option>
			<DataList.Option value=" evenly ">evenly</DataList.Option>
			<!-- <DataList.Option
				onSelect={({ inputElement }) => {
					const start = Math.max(0, inputElement.selectionStart ?? 0);
					inputElement.setSelectionRange(start + 1, start + 1);
					navigator.vibrate(VIBRATE_DURATION);
					inputElement.dispatchEvent(new Event('input', { bubbles: true }));
				}}
			>
				<Badge class="rounded-full p-2 px-3">
					<Trash />
				</Badge>
			</DataList.Option>
			<DataList.Option
				onSelect={({ inputElement }) => {
					const start = Math.max(0, inputElement.selectionStart ?? 0);
					inputElement.setSelectionRange(start + 1, start + 1);
					navigator.vibrate(VIBRATE_DURATION);
					inputElement.dispatchEvent(new Event('input', { bubbles: true }));
				}}
			>
				<Badge class="rounded-full p-2 px-3">
					<Trash />
				</Badge>
			</DataList.Option>
			<DataList.Option
				onSelect={({ inputElement }) => {
					const start = Math.max(0, inputElement.selectionStart ?? 0);
					inputElement.setSelectionRange(start + 1, start + 1);
					navigator.vibrate(VIBRATE_DURATION);
					inputElement.dispatchEvent(new Event('input', { bubbles: true }));
				}}
			>
				<Badge class="rounded-full p-2 px-3">
					<Trash />
				</Badge>
			</DataList.Option> -->
		{/if}
	</DataList.Root>
</VisualViewportView>

<style>
</style>
