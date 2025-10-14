<script lang="ts">
	let content = $state(
		'Click anywhere in this text to see the magic! You can insert emojis at any position.'
	);
	let caretInfo = $state<CaretPosition | null>(null);
	let containerEl = $state<HTMLDivElement>();

	function handleClick(e: MouseEvent) {
		if (!document.caretPositionFromPoint) {
			// WebKit fallback
			const range = (document as any).caretRangeFromPoint?.(e.clientX, e.clientY);
			if (range) {
				caretInfo = range;
			}
			return;
		}

		const position = document.caretPositionFromPoint(e.clientX, e.clientY);

		if (position) {
			caretInfo = position;
		}
	}
	$inspect(caretInfo);
</script>

<p onclick={handleClick} contenteditable="true">
	Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid, voluptatum doloremque ducimus
	modi maiores quo incidunt reiciendis, minus blanditiis beatae nostrum impedit nihil tenetur
	suscipit necessitatibus repudiandae, veniam consequatur omnis voluptatem. Quam.
</p>

<p onclick={handleClick} contenteditable="true">
	Lorem ipsum dolor sit amet consectetur adipisicing elit. landitiis beatae nostrum impedit nihil
	tenetur susci
</p>

{#if caretInfo}
	<div class="info">
		{JSON.stringify(caretInfo, null, 2)}
	</div>
{/if}

<style>
	p {
		cursor: pointer;
		padding: 20px;
	}
</style>
