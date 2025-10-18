<script lang="ts" module>
	import type { UserId } from '$lib/shared/schema/user';
	export type Item = {
		id: string;
		name: string;
		amount: string;
		selected: boolean;
		locked: boolean;
	};
	export type Split = { user: UserId; share: number };
	export type ItemSplitData = { user: UserId; share: number }[];
</script>

<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import FormDescription from '$lib/components/ui/form/form-description.svelte';
	import { currencyFormat } from '$lib/shared/currency/currency';
	import Calculator from './calculator.svelte';
	import { useActiveElement } from '$lib/hooks/use-active-element.svelte';
	import { onMount, untrack } from 'svelte';
	import { scale } from 'svelte/transition';
	import CheckboxButton from './checkbox-button.svelte';
	import CheckboxGroup from './checkbox-group.svelte';
	import ItemSelectMenu from './item-select-menu.svelte';
	import LockSquareRoundedFilled from '@tabler/icons-svelte/icons/lock-square-rounded-filled';

	let items = $state<Item[]>([]);

	const addModifiers = ['tax', 'tip'];
	const subtractModifiers = ['discount', 'off', 'offer'];

	// Generate unique IDs
	function generateId() {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	const autoFillItemNames = () => {
		items = [
			{ id: generateId(), name: 'Chicken', amount: '200*2', selected: false, locked: false },
			{ id: generateId(), name: 'Beef', amount: '150*2', selected: false, locked: true }
			// { id: generateId(), name: 'Fish', amount: '100*2', selected: false, locked: false },
			// { id: generateId(), name: 'Rice', amount: '50*2', selected: false, locked: false },
			// { id: generateId(), name: 'Water', amount: '10*2', selected: false, locked: false },
			// { id: generateId(), name: 'Tax', amount: '5%', selected: false, locked: false },
			// { id: generateId(), name: 'Discount', amount: '10%', selected: false, locked: false }
		];
	};

	onMount(() => {
		autoFillItemNames();
	});

	const filledCount = $derived(items.filter((item) => item.amount !== '').length);
	// Effect reacts to derived value
	$effect(() => {
		if (filledCount === items.length && items.length > 0) {
			untrack(() => {
				items = [
					...items,
					{ id: generateId(), name: '', amount: '', selected: false, locked: false }
				];
			});
		}
	});

	const activeElement = useActiveElement();

	const id = $props.id();

	const selection = $derived(items.some((item) => item.selected));

	const calculatorOpen = $derived(activeElement.current?.id.startsWith(`item-amt-${id}-`) || false);

	const itemSelectOpen = $derived(selection || false);
</script>

<CheckboxGroup groupId="items-group">
	<section>
		{#each items as item, idx (item.id)}
			{@const isAddModifier = addModifiers.includes(item.name.toLowerCase().split(' ').pop() || '')}
			{@const isSubtractModifier = subtractModifiers.includes(
				item.name.toLowerCase().split(' ').pop() || ''
			)}
			<div class="grid grid-cols-[auto_1fr_2ch_auto] items-center gap-2 p-2">
				{#if item.locked}
					<LockSquareRoundedFilled class="text-destructive" />
				{:else}
					<CheckboxButton
						tabindex={-1}
						bind:selected={item.selected}
						id={`item-select-${id}-${item.id}`}
					/>
				{/if}
				<div class="w-fit flex-1">
					<Input
						id={`item-name-${id}-${item.id}`}
						type="text"
						bind:value={item.name}
						tabindex={-1}
						placeholder={`Item#${idx + 1}`}
						variant="underlined"
						class="field-sizing-content min-w-9 text-left"
						autocomplete="off"
						inputmode="text"
						list="item-name-list"
					/>
				</div>
				<datalist id="item-name-list">
					<option value="Tax"></option>
					<option value="Discount"></option>
					<option value="Tip"></option>
					<option value="Rest"></option>
				</datalist>
				<span
					class="relative inline-flex w-[2ch] items-center justify-center text-lg text-muted-foreground/50 select-none"
				>
					{#key isAddModifier ? 'add' : isSubtractModifier ? 'sub' : 'eq'}
						<span
							class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono whitespace-nowrap"
							in:scale={{ duration: 200 }}
							out:scale={{ duration: 200 }}
						>
							{#if isAddModifier}
								+=
							{:else if isSubtractModifier}
								-=
							{:else}
								=
							{/if}
						</span>
					{/key}
				</span>
				<div class="flex justify-end">
					<Input
						id={`item-amt-${id}-${item.id}`}
						type="text"
						placeholder="0"
						variant="underlined"
						class="field-sizing-content min-w-9 text-center"
						autocomplete="off"
						inputmode="numeric"
						onfocus={(e) => e.currentTarget.select()}
						bind:value={item.amount}
					/>
				</div>
			</div>
		{/each}
	</section>
</CheckboxGroup>
<FormDescription>
	Remaining {currencyFormat('USD', 100)}
	<!-- {activeElement.current} -->
</FormDescription>

<ItemSelectMenu open={itemSelectOpen} bind:items />
<Calculator open={calculatorOpen} />
