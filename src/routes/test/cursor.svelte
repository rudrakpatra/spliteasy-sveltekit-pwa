<script lang="ts">
	let value = $state('');
	let inputEl = $state<HTMLInputElement>();

	let cursor = $state({ start: 0, end: 0 });

	function updateCursor() {
		if (inputEl) {
			cursor = {
				start: inputEl.selectionStart ?? 0,
				end: inputEl.selectionEnd ?? 0
			};
		}
	}
</script>

<input
	type="text"
	bind:value
	bind:this={inputEl}
	placeholder="0.00"
	onselectionchange={updateCursor}
	onclick={updateCursor}
	onkeyup={updateCursor}
/>

<pre>{JSON.stringify(cursor, null, 2)}</pre>
