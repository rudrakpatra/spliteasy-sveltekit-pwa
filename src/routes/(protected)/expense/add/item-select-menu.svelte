<script lang="ts">
	import { KeyboardAwareView, VisualViewportView } from '$lib/components/ui/view';
	import * as DataList from '$lib/components/ui/data-list';
	import ArrowsSplit from '@tabler/icons-svelte/icons/arrows-split';
	import { VIBRATE_DURATION } from '$lib/constants';
	import { cn } from '$lib/utils';
	import { EmblaScrollArea } from '$lib/components/ui/embla-scroll-area';
	import type { Item } from './items.svelte';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Input } from '$lib/components/ui/input';
	import { getExpenseFormContext } from './context.svelte';
	import X from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button';
	import Check from '@lucide/svelte/icons/check';
	import type { UserId } from '$lib/shared/schema/user';

	let { open = $bindable(false), items = $bindable([]) }: { open: boolean; items: Item[] } =
		$props();

	const keys = [
		{
			icon: Trash,
			label: 'Delete',
			show: () => true,
			onDown: createKeyDownHandler('delete'),
			onSelect: () => {
				items = items.filter((item) => !item.selected);
			}
		},
		{
			icon: ArrowsSplit,
			label: 'Split By Shares',
			show: () => true,
			onDown: createKeyDownHandler('split'),
			onSelect: () => {
				openSplit = true;
			}
		}
	];

	function createKeyDownHandler(symbol: string) {
		return (e: Event) => {
			navigator.vibrate(VIBRATE_DURATION);
		};
	}

	function createKeySelectHandler(symbol: string) {
		return (e: Event) => {
			document.execCommand('insertText', false, symbol);
		};
	}

	const selectedCount = $derived(items.filter((item) => item.selected).length);

	const { membersQuery } = getExpenseFormContext();

	let openSplit = $state(false);

	let splitData = $state<{ user: UserId; share: number }[]>([]);
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

<DataList.Root
	bind:open
	class={cn('fixed inset-x-0 bottom-0 z-10', 'border-t-2 border-border py-1', 'text-foreground')}
>
	<div role="presentation" class="absolute top-0 -z-50 h-screen w-full bg-background"></div>
	<div class="px-2 text-xs text-muted-foreground select-none">{selectedCount} items selected</div>
	<EmblaScrollArea class="h-full py-1" containerClass="flex items-center gap-2 px-2">
		{#each keys as key}
			{@const Icon = key.icon}
			{#if key.show()}
				<DataList.Option
					class="flex-shrink-0 rounded-full bg-primary p-2 px-3 text-primary-foreground active:bg-accent active:text-accent-foreground"
					onDown={key.onDown}
					onSelect={key.onSelect}
				>
					<div class="flex items-center text-sm select-none">
						<Icon style="width: 24px; height: 20px;" />
						{key.label}
					</div>
				</DataList.Option>
			{/if}
		{/each}
	</EmblaScrollArea>
</DataList.Root>

<Drawer.Root bind:open={openSplit} repositionInputs={false} direction="bottom">
	<Drawer.Content style="padding-bottom: env(keyboard-inset-height, 0px);">
		{#snippet children()}
			{@const { data, isLoading, isSuccess, error } = $membersQuery}
			<!-- {@const data = [
				{ user: { id: 1, name: 'Alice', img: '' }, share: 1 },
				{ user: { id: 2, name: 'Bob', img: '' }, share: 1 },
				// { user: { id: 3, name: 'Charlie', img: '' }, share: 1 },
				// { user: { id: 4, name: 'David', img: '' }, share: 1 },
				// { user: { id: 5, name: 'Eve', img: '' }, share: 1 },
				// { user: { id: 6, name: 'Frank', img: '' }, share: 1 },
				// { user: { id: 7, name: 'Grace', img: '' }, share: 1 },
				// { user: { id: 8, name: 'Hank', img: '' }, share: 1 },
				// { user: { id: 9, name: 'Ivy', img: '' }, share: 1 },
				// { user: { id: 10, name: 'Jack', img: '' }, share: 1 },
				// { user: { id: 11, name: 'Jill', img: '' }, share: 1 },
				// { user: { id: 12, name: 'John', img: '' }, share: 1 },
				// { user: { id: 13, name: 'Julia', img: '' }, share: 1 },
				// { user: { id: 14, name: 'Morgan', img: '' }, share: 1 },
				// { user: { id: 15, name: 'Nancy', img: '' }, share: 1 },
				// { user: { id: 16, name: 'Oscar', img: '' }, share: 1 },
				// { user: { id: 17, name: 'Pete', img: '' }, share: 1 },
				// { user: { id: 18, name: 'Quinn', img: '' }, share: 1 },
				{ user: { id: 19, name: 'Jonah', img: '' }, share: 1 }
			]} -->
			{@const selectedItems = items.filter((item) => item.selected)}

			<Drawer.Header>
				<Drawer.Title class="flex items-start justify-between gap-2">
					<Drawer.Close>
						<Button size="icon-lg" variant="ghost"><X class="size-8" /></Button>
					</Drawer.Close>
					<div class="text-center text-lg font-medium text-balance text-foreground">
						<span class="text-muted-foreground">Split</span>
						{#each selectedItems as item, idx}
							{@const name = item.name || '�Item'}
							{#if idx === 0}
								<span class="font-semibold text-foreground">{name}</span>
							{:else if idx === selectedItems.length - 1}
								<span class="font-semibold text-foreground">&nbsp;& {name}</span>
							{:else}
								<span class="font-semibold text-foreground">, {name}</span>
							{/if}
						{/each}
						<span class="whitespace-nowrap text-muted-foreground"> by shares</span>
					</div>
					<Drawer.Close>
						<Button
							onclick={() => {
								openSplit = false;
								splitData = [];
							}}
							size="icon-lg"
							variant="ghost"><Check class="size-8" /></Button
						>
					</Drawer.Close>
				</Drawer.Title>
			</Drawer.Header>

			<!-- Scrollable Content -->
			<div
				data-vaul-no-drag
				class="flex flex-col gap-2 overflow-y-auto overscroll-contain p-2 px-6"
				style="height: calc(60svh - env(keyboard-inset-height, 0px));"
			>
				{#each data as { user }}
					<div class="group grid grid-cols-[1fr_auto] items-center gap-3 select-none">
						<label class="flex items-center gap-2" for={`share-${user.id}`}>
							<Avatar.Root class="size-9 flex-shrink-0">
								<Avatar.Image src={user.img} alt={user.name} />
								<Avatar.Fallback>
									{user.name.slice(0, 1).toUpperCase()}
								</Avatar.Fallback>
							</Avatar.Root>
							<span class="flex-1 truncate font-medium">{user.name}</span>
						</label>
						<Input
							id={`share-${user.id}`}
							type="text"
							placeholder="0"
							variant="underlined"
							class="field-sizing-content min-w-9 text-center"
							autocomplete="off"
							inputmode="numeric"
							onfocus={(e) => e.currentTarget.select()}
						/>
					</div>
				{/each}
			</div>
			<!-- Fixed Footer -->
			<Drawer.Footer class="text-center text-sm text-muted-foreground">
				{1} Total shares
			</Drawer.Footer>
		{/snippet}
	</Drawer.Content>
</Drawer.Root>
