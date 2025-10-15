<script lang="ts">
	import { onMount } from 'svelte';
	import './token.css';

	let tokens = $state([
		{ id: 1, type: 'amount', value: '100' },
		{ id: 2, type: 'text', value: 'for' },
		{ id: 3, type: 'category', value: 'food' }
	]);

	let container: HTMLDivElement;
	let isUpdating = false;

	function saveCursorPosition() {
		const sel = window.getSelection();
		if (!sel || !sel.rangeCount || !container) return null;

		const range = sel.getRangeAt(0);
		const preRange = range.cloneRange();
		preRange.selectNodeContents(container);
		preRange.setEnd(range.startContainer, range.startOffset);

		// Calculate tokens before cursor
		let tokensBeforeCursor = 0;
		const allNodes = Array.from(container.childNodes);

		for (const node of allNodes) {
			if (node === range.startContainer) break;
			if (node.nodeType === Node.ELEMENT_NODE) {
				tokensBeforeCursor++;
			}
		}

		return {
			offset: preRange.toString().length,
			container: range.startContainer,
			startOffset: range.startOffset,
			tokensBeforeCursor: tokensBeforeCursor
		};
	}

	function restoreCursorPosition(savedPosition: any) {
		if (!savedPosition || !container) return;

		const sel = window.getSelection();
		if (!sel) return;

		let charCount = 0;
		let tokenCount = 0;

		function findPosition(node: Node): boolean {
			if (node.nodeType === Node.TEXT_NODE) {
				const textLength = node.textContent?.length || 0;
				if (charCount + textLength >= savedPosition.offset) {
					const range = document.createRange();
					const offsetInNode = Math.max(0, savedPosition.offset - charCount);
					range.setStart(node, offsetInNode);
					range.collapse(true);
					sel!.removeAllRanges();
					sel!.addRange(range);
					return true;
				}
				charCount += textLength;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				// Increment token count for each element node (token)
				tokenCount++;

				for (let child of Array.from(node.childNodes)) {
					if (findPosition(child)) return true;
				}
				// Add +1 for space/separator after token
				charCount += 1;
			} else {
				for (let child of Array.from(node.childNodes)) {
					if (findPosition(child)) return true;
				}
			}
			return false;
		}

		findPosition(container);
	}

	function parseContentToTokens() {
		if (!container || isUpdating) return;

		const text = container.innerText || '';
		const words = text.split(/\s+/).filter((w) => w.trim());
		tokens = words.map((word, idx) => ({
			id: idx + 1,
			type: /^\d+$/.test(word) ? 'amount' : 'text',
			value: word
		}));
	}

	function renderTokensToDOM() {
		if (!container || isUpdating) return;

		isUpdating = true;
		const cursorPos = saveCursorPosition();

		const fragment = document.createDocumentFragment();
		const before = document.createElement('span');
		before.textContent = '';
		before.style.width = 'var(--spacing)';
		fragment.appendChild(before);
		tokens.forEach((token, idx) => {
			const span = document.createElement('span');
			span.className = 'token';
			span.textContent = token.value;
			fragment.appendChild(span);
		});
		const after = document.createElement('span');
		after.textContent = ' ';
		after.style.width = 'var(--spacing)';
		fragment.appendChild(after);

		container.innerHTML = '';
		container.appendChild(fragment);

		restoreCursorPosition(cursorPos);
		isUpdating = false;
	}

	function handleBackspace(e: KeyboardEvent) {
		const sel = window.getSelection();
		if (!sel || !sel.rangeCount) return;

		const range = sel.getRangeAt(0);
		const node = range.startContainer;
		const offset = range.startOffset;

		if (offset === 1 && node.nodeType === Node.TEXT_NODE && node.textContent!.length > 1) {
			const parentSpan = node.parentElement;

			if (parentSpan?.classList.contains('token')) {
				e.preventDefault();

				if (node.textContent && node.textContent.length > 0) {
					node.textContent = node.textContent.slice(1);
				}

				const newRange = document.createRange();
				newRange.setStart(node, 0);
				newRange.collapse(true);
				sel.removeAllRanges();
				sel.addRange(newRange);
			}
		}
	}

	function handleEnter(e: KeyboardEvent) {
		e.preventDefault();
		const sel = window.getSelection();
		if (!sel || !sel.rangeCount) return;

		const range = sel.getRangeAt(0);
		const allChildren = Array.from(container.childNodes);

		let currentNode = range.startContainer;
		if (currentNode.nodeType === Node.TEXT_NODE) {
			currentNode = currentNode.parentNode!;
		}

		let currentIndex = -1;
		for (let i = 0; i < allChildren.length; i++) {
			if (allChildren[i] === currentNode || allChildren[i].contains(currentNode)) {
				currentIndex = i;
				break;
			}
		}

		const nextIndex = currentIndex + 1;
		if (nextIndex < allChildren.length) {
			const targetNode = allChildren[nextIndex];
			const newRange = document.createRange();

			if (targetNode.nodeType === Node.TEXT_NODE) {
				newRange.setStart(targetNode, 0);
			} else {
				newRange.setStart(targetNode, 0);
			}

			newRange.collapse(true);
			sel.removeAllRanges();
			sel.addRange(newRange);
		}
	}

	function handleInput() {
		parseContentToTokens();
		renderTokensToDOM();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleEnter(e);
		} else if (e.key === 'Backspace') {
			handleBackspace(e);
		}
	}

	$inspect(tokens);
	onMount(() => {
		renderTokensToDOM();
	});
</script>

<div
	class="token-container flex flex-wrap gap-0 p-2 text-3xl focus:outline-none"
	bind:this={container}
	contenteditable="true"
	oninput={handleInput}
	onkeydown={handleKeydown}
	role="textbox"
	tabindex={0}
></div>
