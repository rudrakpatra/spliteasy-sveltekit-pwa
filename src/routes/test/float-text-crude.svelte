<script lang="ts">
	import { onMount } from 'svelte';

	let textareaEl = $state<HTMLTextAreaElement>();
	let boxPosition = $state({ top: 0, left: 0 });

	function updateBoxPosition() {
		if (!textareaEl) return;

		// Use a library approach with canvas measurement
		const position = textareaEl.selectionStart ?? 0;
		const text = textareaEl.value.substring(0, position);
		const lines = text.split('\n');

		const computed = window.getComputedStyle(textareaEl);
		const lineHeight = parseFloat(computed.lineHeight);
		const paddingTop = parseFloat(computed.paddingTop);
		const paddingLeft = parseFloat(computed.paddingLeft);

		const rect = textareaEl.getBoundingClientRect();

		// Calculate line number
		const lineNumber = lines.length - 1;
		const lastLine = lines[lines.length - 1];

		// Rough character width estimation
		const charWidth = parseFloat(computed.fontSize) * 0.6;

		boxPosition = {
			top:
				rect.top +
				paddingTop +
				lineNumber * lineHeight +
				lineHeight -
				textareaEl.scrollTop +
				window.scrollY,
			left: rect.left + paddingLeft + lastLine.length * charWidth + window.scrollX
		};
	}
</script>

<textarea
	bind:this={textareaEl}
	oninput={updateBoxPosition}
	onclick={updateBoxPosition}
	onkeyup={updateBoxPosition}
	placeholder="Type here..."
	rows="8"
></textarea>

<div class="caret-box" style="top: {boxPosition.top}px; left: {boxPosition.left}px;">💬</div>

<style>
	textarea {
		width: 100%;
		padding: 1rem;
		font-size: 1rem;
		font-family: monospace;
	}

	.caret-box {
		position: fixed;
		background: #8b5cf6;
		padding: 0.5rem;
		border-radius: 4px;
		pointer-events: none;
	}
</style>
