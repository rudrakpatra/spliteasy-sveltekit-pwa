<script lang="ts" module>
	import { getContext, setContext } from 'svelte';

	const CHECKBOX_GROUP_KEY = Symbol('checkbox-group');

	interface CheckboxGroupContext {
		isDragging: boolean;
		dragState: boolean | null;
		isMultiSelectActive: boolean;
		startDrag: (initialState: boolean) => void;
		stopDrag: () => void;
		registerCheckbox: (
			id: string,
			element: HTMLElement,
			getSelected: () => boolean,
			setSelected: (val: boolean) => void
		) => void;
		unregisterCheckbox: (id: string) => void;
	}

	export function getCheckboxGroupContext() {
		return getContext<CheckboxGroupContext>(CHECKBOX_GROUP_KEY);
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		groupId?: string;
	}

	let { children, groupId }: Props = $props();

	let isDragging = $state(false);
	let dragState = $state<boolean | null>(null);
	let isMultiSelectActive = $state(false);

	let checkboxRegistry = new Map<
		string,
		{
			element: HTMLElement;
			getSelected: () => boolean;
			setSelected: (val: boolean) => void;
		}
	>();

	function startDrag(initialState: boolean) {
		isDragging = true;
		dragState = initialState;
		isMultiSelectActive = true;
	}

	function stopDrag() {
		isDragging = false;
		dragState = null;
		isMultiSelectActive = false;
	}

	function registerCheckbox(
		id: string,
		element: HTMLElement,
		getSelected: () => boolean,
		setSelected: (val: boolean) => void
	) {
		checkboxRegistry.set(id, { element, getSelected, setSelected });
	}

	function unregisterCheckbox(id: string) {
		checkboxRegistry.delete(id);
	}

	function handleGroupPointerMove(e: PointerEvent) {
		if (!isMultiSelectActive || dragState === null) return;

		const target = document.elementFromPoint(e.clientX, e.clientY);
		if (!target) return;

		for (const [id, checkbox] of checkboxRegistry) {
			if (checkbox.element.contains(target)) {
				checkbox.setSelected(dragState);
				break;
			}
		}
	}

	function handleGlobalPointerUp() {
		stopDrag();
	}

	function handleSelectStart(e: Event) {
		if (isDragging) {
			e.preventDefault();
		}
	}

	setContext<CheckboxGroupContext>(CHECKBOX_GROUP_KEY, {
		get isDragging() {
			return isDragging;
		},
		get dragState() {
			return dragState;
		},
		get isMultiSelectActive() {
			return isMultiSelectActive;
		},
		startDrag,
		stopDrag,
		registerCheckbox,
		unregisterCheckbox
	});
</script>

<svelte:window onpointerup={handleGlobalPointerUp} onselectstart={handleSelectStart} />

<div data-checkbox-group={groupId} onpointermove={handleGroupPointerMove}>
	{@render children()}
</div>
