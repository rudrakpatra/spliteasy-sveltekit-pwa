<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import SquareRounded from '@tabler/icons-svelte/icons/square-rounded';
	import SquareRoundedCheckFilled from '@tabler/icons-svelte/icons/square-rounded-check-filled';
	import { getCheckboxGroupContext } from './checkbox-group.svelte';
	import { cn } from '$lib/utils';
	import { onMount, onDestroy } from 'svelte';

	let {
		selected = $bindable(false),
		id,
		longPressDuration = 200,
		class: className,
		...restProps
	}: {
		selected?: boolean;
		id: string;
		longPressDuration?: number;
		class?: string;
	} = $props();

	const group = getCheckboxGroupContext();

	let longPressTimer: number | null = null;
	let longPressTriggered = $state(false);
	let startPosition = $state<{ x: number; y: number } | null>(null);
	let containerElement: HTMLElement;
	let checkboxRef: HTMLElement | null = $state(null);
	let lastTouchedCheckboxId = $state<string | null>(null);

	onMount(() => {
		group.registerCheckbox(
			id,
			containerElement,
			() => selected,
			(val) => {
				if (group.isMultiSelectActive && lastTouchedCheckboxId !== id) {
					navigator.vibrate?.(10);
					lastTouchedCheckboxId = id;
				}
				selected = val;
			}
		);
	});

	onDestroy(() => {
		group.unregisterCheckbox(id);
	});

	function handlePointerDown(e: PointerEvent) {
		startPosition = { x: e.clientX, y: e.clientY };
		longPressTriggered = false;

		longPressTimer = window.setTimeout(() => {
			longPressTriggered = true;
			lastTouchedCheckboxId = id;
			group.startDrag(!selected);
			selected = !selected;
			navigator.vibrate?.(50);
		}, longPressDuration);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!startPosition) return;

		const dx = e.clientX - startPosition.x;
		const dy = e.clientY - startPosition.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance > 10 && longPressTimer && !longPressTriggered) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	function handlePointerUp(e: PointerEvent) {
		// If long press timer is still running (quick tap), cancel it and let bits-ui handle the click
		if (longPressTimer && !longPressTriggered) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
			navigator.vibrate?.(10);
			// Don't toggle here - let bits-ui handle it naturally
		} else if (longPressTriggered) {
			// Long press was triggered, prevent the default click
			e.preventDefault();
			e.stopPropagation();
		}

		if (group.isMultiSelectActive) {
			lastTouchedCheckboxId = null;
		}
		group.stopDrag();
		startPosition = null;
		longPressTriggered = false;
		longPressTimer = null;
	}

	function handlePointerCancel() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		startPosition = null;
		longPressTriggered = false;
	}

	function handleClick(e: MouseEvent | PointerEvent) {
		// Prevent click if long press was triggered
		if (longPressTriggered) {
			e.preventDefault();
			e.stopPropagation();
		}
	}
</script>

<div
	bind:this={containerElement}
	class="relative grid h-full flex-shrink-0 place-content-center"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerCancel}
>
	<!-- Invisible expanded touch target -->
	<span class="absolute -inset-x-1 -inset-y-2 z-0" aria-hidden="true"></span>

	<CheckboxPrimitive.Root
		bind:ref={checkboxRef}
		{id}
		data-slot="checkbox"
		class={cn(
			'relative z-10 cursor-pointer touch-none text-muted-foreground outline-none select-none',
			group.isMultiSelectActive && 'text-primary',
			className
		)}
		bind:checked={selected}
		onclick={handleClick}
		{...restProps}
	>
		{#snippet children({ checked })}
			<span class="pointer-events-none relative block size-6">
				<!-- Unchecked icon with absolute positioning -->
				<span
					class="absolute inset-0 transition-all duration-200"
					class:opacity-0={checked}
					class:scale-50={checked}
					class:opacity-100={!checked}
					class:scale-100={!checked}
				>
					<SquareRounded class="size-6" />
				</span>

				<!-- Checked icon with absolute positioning -->
				<span
					class="absolute inset-0 transition-all duration-200"
					class:opacity-100={checked}
					class:scale-100={checked}
					class:opacity-0={!checked}
					class:scale-75={!checked}
				>
					<SquareRoundedCheckFilled class="size-6 text-primary" />
				</span>
			</span>
		{/snippet}
	</CheckboxPrimitive.Root>
</div>
