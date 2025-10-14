<script lang="ts">
	let textareaEl = $state<HTMLTextAreaElement>();
	let boxPosition = $state({ top: 0, left: 0 });

	function getCaretCoordinates() {
		if (!textareaEl) return { top: 0, left: 0 };

		const position = textareaEl.selectionStart ?? 0;
		const mirror = document.createElement('div');
		const computed = window.getComputedStyle(textareaEl);

		// Copy ALL styles - works with any font
		mirror.style.position = 'absolute';
		mirror.style.visibility = 'hidden';
		mirror.style.whiteSpace = 'pre-wrap';
		mirror.style.wordWrap = 'break-word';
		mirror.style.width = computed.width;
		mirror.style.font = computed.font;
		mirror.style.fontFamily = computed.fontFamily; // ANY font works!
		mirror.style.fontSize = computed.fontSize;
		mirror.style.fontWeight = computed.fontWeight;
		mirror.style.lineHeight = computed.lineHeight;
		mirror.style.letterSpacing = computed.letterSpacing;
		mirror.style.padding = computed.padding;

		const textBeforeCaret = textareaEl.value.substring(0, position);
		mirror.textContent = textBeforeCaret;

		const marker = document.createElement('span');
		marker.textContent = '|';
		mirror.appendChild(marker);

		document.body.appendChild(mirror);

		const textareaRect = textareaEl.getBoundingClientRect();
		const markerRect = marker.getBoundingClientRect();

		const top =
			textareaRect.top +
			(markerRect.top - mirror.getBoundingClientRect().top) -
			textareaEl.scrollTop +
			window.scrollY;
		const left = markerRect.left + window.scrollX;

		document.body.removeChild(mirror);

		return { top, left };
	}

	function updateBoxPosition() {
		const coords = getCaretCoordinates();
		boxPosition = {
			top: coords.top + 22,
			left: coords.left
		};
	}
</script>

<div class="demo">
	<textarea
		bind:this={textareaEl}
		oninput={updateBoxPosition}
		onclick={updateBoxPosition}
		onkeyup={updateBoxPosition}
		onscroll={updateBoxPosition}
		placeholder="Works with ANY font! Try typing..."
		rows="8"
		class="serif-text"
	></textarea>

	<div class="caret-box" style="top: {boxPosition.top}px; left: {boxPosition.left}px;">📍</div>
</div>

<style>
	textarea {
		width: 100%;
		padding: 1rem;
		font-size: 1.1rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
	}

	/* Works perfectly with proportional fonts */
	.serif-text {
		font-family: Georgia, 'Times New Roman', serif;
		line-height: 1.6;
	}

	.caret-box {
		position: fixed;
		background: #10b981;
		color: white;
		padding: 0.5rem;
		border-radius: 4px;
		pointer-events: none;
		font-size: 1.2rem;
	}
</style>
