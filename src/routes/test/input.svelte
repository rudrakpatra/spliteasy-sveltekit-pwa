<script lang="ts">
	let value = $state('');
	let inputEl = $state<HTMLInputElement>();
	let proxyEl = $state<HTMLInputElement>();

	const uid = $props.id();

	let cursor = $state({ start: 0, end: 0 });

	function updateCursor() {
		if (inputEl) {
			cursor = {
				start: inputEl.selectionStart ?? 0,
				end: inputEl.selectionEnd ?? 0
			};

			// Switch focus to proxy to show suggestions
			proxyEl?.focus();
		}
	}

	function handleProxyInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const insertedText = target.value;

		// Clear proxy immediately
		target.value = '';

		if (!insertedText || !inputEl) return;

		// Focus back to main input
		inputEl.focus();

		// Set selection to stored cursor position
		inputEl.setSelectionRange(cursor.start, cursor.end);

		// Use execCommand for undo-friendly insertion
		try {
			if (!document.execCommand('insertText', false, insertedText)) {
				// Fallback if execCommand fails
				fallbackInsert(insertedText);
			}
		} catch (e) {
			fallbackInsert(insertedText);
		}
	}

	function fallbackInsert(text: string) {
		if (!inputEl) return;

		const start = cursor.start;
		const end = cursor.end;
		const currentValue = value;

		// Insert text at cursor position
		value = currentValue.slice(0, start) + text + currentValue.slice(end);

		// Update cursor position after insertion
		const newPos = start + text.length;

		// Need to wait for Svelte to update the DOM
		setTimeout(() => {
			inputEl?.setSelectionRange(newPos, newPos);
		}, 0);
	}

	function handleProxyKeydown(event: KeyboardEvent) {
		// If user types anything other than selecting from datalist,
		// return focus to main input
		if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete') {
			inputEl?.focus();
			// Restore cursor position
			inputEl?.setSelectionRange(cursor.start, cursor.end);
		}
	}
</script>

<input
	type="text"
	bind:value
	bind:this={inputEl}
	placeholder="0.00"
	class="h-full w-full truncate bg-background p-2 text-right transition-colors hover:bg-muted/5 focus:z-10 focus:ring-0 focus:ring-ring focus:outline-none focus:ring-inset"
	autocomplete="off"
	inputmode="numeric"
	onselectionchange={updateCursor}
	onclick={updateCursor}
	onkeyup={updateCursor}
/>

<input
	type="text"
	bind:this={proxyEl}
	list="{uid}-datalist"
	oninput={handleProxyInput}
	onkeydown={handleProxyKeydown}
	class="focus:ring-0 focus:ring-ring focus:outline-none focus:ring-inset"
	tabindex="-1"
/>

<datalist id="{uid}-datalist">
	<option value="+">+</option>
	<option value="-">-</option>
	<option value="*">*</option>
	<option value="/">/</option>
	<option value="%">%</option>
</datalist>

<style>
	input::-webkit-calendar-picker-indicator {
		display: none !important;
	}
</style>
