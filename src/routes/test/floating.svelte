<script lang="ts">
	let inputEl = $state<HTMLInputElement>();
	let boxPosition = $state({ top: 0, left: 0 });
	let showBox = $state(false);

	function updateBoxPosition() {
		if (!inputEl) return;

		const start = inputEl.selectionStart ?? 0;

		// Create temporary element to measure text width up to caret
		const temp = document.createElement('span');
		const computed = window.getComputedStyle(inputEl);

		temp.style.font = computed.font;
		temp.style.fontSize = computed.fontSize;
		temp.style.fontFamily = computed.fontFamily;
		temp.style.fontWeight = computed.fontWeight;
		temp.style.letterSpacing = computed.letterSpacing;
		temp.style.visibility = 'hidden';
		temp.style.position = 'absolute';
		temp.style.whiteSpace = 'pre';
		temp.textContent = inputEl.value.substring(0, start) || ' ';

		document.body.appendChild(temp);
		const textWidth = temp.getBoundingClientRect().width;
		document.body.removeChild(temp);

		const inputRect = inputEl.getBoundingClientRect();
		const paddingLeft = parseFloat(computed.paddingLeft);

		boxPosition = {
			top: inputRect.bottom + window.scrollY,
			left: inputRect.left + paddingLeft + textWidth + window.scrollX
		};

		showBox = true;
	}
</script>

<div class="demo">
	<input
		type="text"
		bind:this={inputEl}
		oninput={updateBoxPosition}
		onclick={updateBoxPosition}
		onkeyup={updateBoxPosition}
		placeholder="Type something..."
	/>

	{#if showBox}
		<div class="caret-box" style="top: {boxPosition.top}px; left: {boxPosition.left}px;">📍</div>
	{/if}
</div>

<style>
	.demo {
		padding: 3rem;
	}

	input {
		width: 400px;
		padding: 0.75rem;
		font-size: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 6px;
	}

	.caret-box {
		position: fixed;
		background: #3b82f6;
		color: white;
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		pointer-events: none;
		z-index: 1000;
	}
</style>
