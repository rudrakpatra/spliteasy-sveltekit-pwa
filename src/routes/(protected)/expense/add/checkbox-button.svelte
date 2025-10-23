<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import SquareRounded from '@tabler/icons-svelte/icons/square-rounded';
	import SquareRoundedCheckFilled from '@tabler/icons-svelte/icons/square-rounded-check-filled';
	import { getCheckboxGroupContext } from './checkbox-group.svelte';
	import { cn } from '$lib/utils';
	import { onMount, onDestroy } from 'svelte';
	import { VIBRATE_DURATION } from '$lib/constants';

	let {
		checked = $bindable(false),
		onCheckedChange,
		id,
		class: className,
		...restProps
	}: {
		checked?: boolean;
		id: string;
		class?: string;
		onCheckedChange?: (checked: boolean) => void;
	} & Omit<CheckboxPrimitive.RootProps, 'checked'> = $props();

	const group = getCheckboxGroupContext();

	let longPressTriggered = $state(false);
	let startPosition = $state<{ x: number; y: number } | null>(null);
	let containerElement: HTMLElement;
	let checkboxRef: HTMLElement | null = $state(null);
	let lastTouchedCheckboxId = $state<string | null>(null);

	onMount(() => {
		group.registerCheckbox(
			id,
			containerElement,
			() => checked,
			(val) => {
				if (group.isMultiSelectActive && lastTouchedCheckboxId !== id) {
					lastTouchedCheckboxId = id;
				}
				checked = val;
			}
		);
	});

	onDestroy(() => {
		group.unregisterCheckbox(id);
	});

	function handlePointerDown(e: PointerEvent) {
		startPosition = { x: e.clientX, y: e.clientY };
		longPressTriggered = true;
		lastTouchedCheckboxId = id;
		group.startDrag(!checked);
		checked = !checked;
	}

	function handlePointerUp(e: PointerEvent) {
		if (group.isMultiSelectActive) {
			lastTouchedCheckboxId = null;
		}
		group.stopDrag();
		startPosition = null;
	}

	function handleClick(e: MouseEvent | PointerEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	// Track previous checked value to detect external changes
	let prevChecked = checked;

	$effect(() => {
		// Only vibrate and focus on actual changes, not on mount
		if (prevChecked !== checked) {
			navigator.vibrate?.(VIBRATE_DURATION);
			prevChecked = checked;
			onCheckedChange?.(checked);
			checkboxRef?.focus();
		}
	});
</script>

<div
	bind:this={containerElement}
	class="relative grid h-full flex-shrink-0 place-content-center"
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
>
	<!-- Invisible expanded touch target -->
	<span class="absolute -inset-x-1 -inset-y-2 z-0" aria-hidden="true"></span>

	<CheckboxPrimitive.Root
		{id}
		bind:ref={checkboxRef}
		data-slot="checkbox"
		class={cn('relative z-10 cursor-pointer touch-none text-muted-foreground', className)}
		bind:checked
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
