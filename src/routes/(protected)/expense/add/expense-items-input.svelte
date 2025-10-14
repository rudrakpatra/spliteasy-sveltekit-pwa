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

	// Computed values
	const totalAmount = $derived(
		data.items.reduce((total, item) => total + parseFloat(item.amount || '0'), 0)
	);

	function addItem() {
		data.items.push({
			id: crypto.randomUUID(),
			name: '',
			nameEl: null as HTMLInputElement | null,
			amount: '',
			amountEl: null as HTMLInputElement | null,
			shares: new Array(data.participants.length).fill('')
		});
		setTimeout(() => {
			data.items[data.items.length - 1].nameEl?.focus();
		}, 0);
	}

	function toggleItem() {
		console.log('selectItem');
	}

	function removeItem(itemId: string) {
		console.log(itemId);
		data.items = data.items.filter((item) => item.id !== itemId);
	}

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
</script>

<!-- <div class="flex items-center justify-between px-3 py-1 text-muted-foreground">
	<span>Total</span>
	<span>{totalAmount.toFixed(2)}</span>
</div> -->
<span class="w-full border-b border-border">
	<label class="text-muted-foreground"
		>Add
		<input
			class="inline-block min-w-0 rounded-lg p-1 text-primary placeholder:text-muted-foreground/50 focus:ring-0 focus:ring-transparent"
			type="text"
			placeholder="item"
			minlength={0}
			autocomplete="off"
			inputmode="text"
		/>
	</label>
	<label class="text-muted-foreground"
		>for
		<input
			class="inline-block min-w-0 rounded-lg p-1 text-primary placeholder:text-muted-foreground/50 focus:ring-0 focus:ring-transparent"
			type="text"
			placeholder="amount"
			autocomplete="off"
			inputmode="numeric"
		/>
	</label>
</span>
<br />
<span class="w-full border-b border-border">
	<label class="text-muted-foreground"
		>Add
		<input
			class="inline-block min-w-0 rounded-lg p-1 text-primary placeholder:text-muted-foreground/50 focus:ring-0 focus:ring-transparent"
			type="text"
			placeholder="item"
			minlength={0}
			autocomplete="off"
			inputmode="text"
		/>
	</label>
	<label class="text-muted-foreground"
		>for
		<input
			class="inline-block min-w-0 rounded-lg p-1 text-primary placeholder:text-muted-foreground/50 focus:ring-0 focus:ring-transparent"
			type="text"
			placeholder="amount"
			autocomplete="off"
			inputmode="numeric"
		/>
	</label>
</span>
<!-- <InputGroup.Root>
	<InputGroup.Addon>
		<InputGroup.Text>Add</InputGroup.Text>
	</InputGroup.Addon>
	<InputGroup.Input type="text" class="" placeholder="Item Name..." />
	<InputGroup.Text>for</InputGroup.Text>
	<InputGroup.Input
		type="text"
		placeholder="0.00"
		class="text-right "
		autocomplete="off"
		inputmode="numeric"
	/>
</InputGroup.Root> -->
<div class="flex flex-wrap gap-2">
	<div class="w-full text-xs text-muted-foreground">worth {200.524}</div>
	<Badge variant="default" tabindex={0}>Add Item</Badge>
	<Badge variant="default" tabindex={0}>Split Evenly</Badge>
	<Badge variant="default" tabindex={0}>Split By Shares</Badge>
	<Badge variant="default" tabindex={0}>Remainder</Badge>
</div>
<div class="rounded-md border-1 border-input shadow-xs">
	<!-- <div class="my-2 flex justify-between px-3 text-center text-xs text-muted-foreground">
		<b>Name</b>
		<b>Amt.</b>
	</div> -->

	<!-- <div class="my-2 flex justify-between px-3 text-center text-xs text-muted-foreground">
		<b>Participant</b>
		<b>Share</b>
	</div> -->
	<!-- <div class="my-2 flex justify-center px-3 text-center text-xs text-muted-foreground">
		<b class="inline-flex items-center gap-1">
			Split by shares
			<ChartPieFilled class="h-4 w-4 fill-muted-foreground" />
		</b>
	</div> -->
	{#each participants as participant}
		<InputGroup.Root
			class="rounded-none border-transparent shadow-none first:rounded-t-md  last:rounded-b-md focus-within:z-10"
		>
			<InputGroup.Addon>
				<Avatar.Root class="h-6 w-6 flex-shrink-0">
					<Avatar.Image src="" alt={participant} />
					<Avatar.Fallback>
						{participant.slice(0, 1).toUpperCase()}
					</Avatar.Fallback>
				</Avatar.Root>
				<InputGroup.Text class="text-xs">{participant}</InputGroup.Text>
			</InputGroup.Addon>
			<InputGroup.Input
				id={`share-${participant}`}
				type="text"
				placeholder="_"
				class="text-right placeholder:opacity-20"
				autocomplete="off"
				inputmode="numeric"
				onfocus={(e) => {
					//e.currentTarget.select()
				}}
			/>
			<!-- <InputGroup.Addon align="inline-end">
				<InputGroup.Button size="icon-xs" onclick={() => removeItem('2')}>
					<ChartPieFilled class="opacity-50" />
				</InputGroup.Button>
			</InputGroup.Addon> -->
		</InputGroup.Root>
	{/each}
</div>

<VisualViewportView forceOverlaysContent>
	<DataList.Root
		class="absolute inset-0 top-auto flex h-12 items-start gap-3 overflow-auto border-t border-border bg-background px-3 py-1 text-foreground"
	>
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
	</DataList.Root>
</VisualViewportView>

<style>
	/* input::-webkit-calendar-picker-indicator {
		display: none !important;
	} */
	input {
		field-sizing: content;
	}
	input:focus {
		outline: none;
	}
</style>
