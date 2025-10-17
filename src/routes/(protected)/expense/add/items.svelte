<script lang="ts">
	import { Input } from '$lib/components/ui/input'; // adjust import as needed
	import * as Tabs from '$lib/components/ui/tabs';
	import Cube from '@tabler/icons-svelte/icons/cube';
	import CubePlus from '@tabler/icons-svelte/icons/cube-plus';

	let items = $state<{ name: string; amount: string }[]>([]);

	const modifiers = ['tax', 'tip', 'discount', 'off'];

	$effect(() => {
		if (items.length === 0) {
			items = [{ name: '', amount: '' }];
		}
		if (items[items.length - 1].name !== '' && items[items.length - 1].amount !== '') {
			items = [...items, { name: '', amount: '' }];
		}
	});
</script>

<Tabs.Content value="items">
	{#each items as item}
		{@const isModifier = modifiers.includes(item.name.split(' ').pop() || '')}
		<div class="flex items-center justify-between gap-3 px-3 py-1.5">
			{#if isModifier}
				<CubePlus class="size-6 flex-shrink-0" />
			{:else}
				<Cube class="size-6 flex-shrink-0" />
			{/if}
			<span class="flex-1">
				<Input
					id={`item-name-${item.name}`}
					type="text"
					bind:value={item.name}
					placeholder="Name"
					variant="underlined"
					class="field-sizing-content max-w-fit min-w-[4ch] text-left text-sm"
					autocomplete="off"
					inputmode="text"
					onfocus={(e) => e.currentTarget.select()}
				/>
			</span>
			<Input
				id={`item-amt-${item.name}`}
				type="text"
				bind:value={item.amount}
				placeholder="Amount"
				variant="underlined"
				class="field-sizing-content max-w-fit min-w-[4ch] text-right text-sm"
				autocomplete="off"
				inputmode="numeric"
				onfocus={(e) => e.currentTarget.select()}
			/>
		</div>
	{/each}
</Tabs.Content>
