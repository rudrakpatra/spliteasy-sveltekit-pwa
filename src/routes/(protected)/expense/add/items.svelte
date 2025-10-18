<script lang="ts" module>
	export type Item = { id: string; name: string; amount: string; selected: boolean };
</script>

<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import SquareRoundedCheckFilled from '@tabler/icons-svelte/icons/square-rounded-check-filled';
	import SquareRounded from '@tabler/icons-svelte/icons/square-rounded';
	import ShoppingCartMinus from '@tabler/icons-svelte/icons/shopping-cart-minus';
	import FormDescription from '$lib/components/ui/form/form-description.svelte';
	import { currencyFormat } from '$lib/shared/currency/currency';
	import Calculator from './calculator.svelte';
	import { useActiveElement } from '$lib/hooks/use-active-element.svelte';
	import { onMount, untrack } from 'svelte';
	import { scale } from 'svelte/transition';
	import CheckboxButton from './checkbox-button.svelte';
	import CheckboxGroup from './checkbox-group.svelte';
	import ItemSelectMenu from './item-select-menu.svelte';

	let items = $state<Item[]>([]);

	const addModifiers = ['tax', 'tip'];
	const subtractModifiers = ['discount', 'off', 'offer'];

	// Generate unique IDs
	function generateId() {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	$effect(() => {
		let filled = 0;
		for (let i = 0; i < items.length; i++) {
			if (items[i].amount !== '') {
				filled++;
			}
		}
		// if all amount fields are filled add another field
		if (filled === items.length) {
			untrack(() => {
				items = [...items, { id: generateId(), name: '', amount: '', selected: false }];
			});
		}
	});

	const autoFillItemNames = () => {
		items = [
			{ id: generateId(), name: 'Chicken', amount: '200*2', selected: false },
			{ id: generateId(), name: 'Beef', amount: '150*2', selected: false },
			{ id: generateId(), name: 'Fish', amount: '100*2', selected: false },
			{ id: generateId(), name: 'Rice', amount: '50*2', selected: false },
			{ id: generateId(), name: 'Water', amount: '10*2', selected: false },
			{ id: generateId(), name: 'Tax', amount: '5%', selected: false },
			{ id: generateId(), name: 'Discount', amount: '10%', selected: false }
		];
	};

	onMount(() => {
		autoFillItemNames();
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
				<CheckboxButton bind:selected={item.selected} id={`item-select-${id}-${item.id}`} />
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
				</datalist>
				<span
					class="relative inline-flex w-[2ch] items-center justify-center text-lg text-muted-foreground/50"
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
