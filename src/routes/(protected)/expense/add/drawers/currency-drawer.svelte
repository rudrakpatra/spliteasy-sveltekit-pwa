<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Command from '$lib/components/ui/command';
	import * as Empty from '$lib/components/ui/empty';
	import { currencies } from '$lib/shared/currency/currency-codes';
	import CashBanknote from '@tabler/icons-svelte/icons/cash-banknote';

	let { open = $bindable(false) }: { open: boolean } = $props();

	const ctx = getExpenseFormContext();
	const { form } = ctx;
	const { form: formData } = form;
</script>

<Drawer.Root bind:open repositionInputs={false}>
	<Drawer.Content style="padding-bottom: env(keyboard-inset-height, 0px);">
		<div
			data-vaul-no-drag
			class="overflow-y-auto overscroll-contain"
			style="height: calc(90svh - env(keyboard-inset-height, 0px));"
		>
			<Command.Root class="flex flex-col bg-transparent">
				<Command.Input autofocus placeholder="Search by code, name or countries..." />
				<Command.List class="max-h-full flex-1">
					<Command.Empty>
						<Empty.Root>
							<Empty.Header>
								<Empty.Media variant="icon">
									<CashBanknote />
								</Empty.Media>
								<Empty.Title>No Currencies Found</Empty.Title>
							</Empty.Header>
						</Empty.Root>
					</Command.Empty>
					<Command.Group title="Currencies">
						{#each currencies as currency (currency.code)}
							<Command.Item
								value={currency.code}
								keywords={[currency.code, currency.currency, ...currency.countries]}
								onSelect={() => {
									$formData.currency = currency.code;
									open = false;
								}}
								class="flex items-center justify-between gap-2 aria-selected:bg-transparent"
							>
								<b>{currency.currency}</b>
								<span>{currency.code}</span>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</div>
	</Drawer.Content>
</Drawer.Root>
