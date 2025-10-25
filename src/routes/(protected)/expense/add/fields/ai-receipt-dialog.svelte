<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { getExpenseFormContext } from '../context.svelte';

	const ctx = getExpenseFormContext();
</script>

{#if ctx.ai.file.current}
	<Dialog.Root>
		<Dialog.Trigger type="button">
			<img
				class="sticky top-4 aspect-square max-h-16 rounded-md object-cover"
				src={ctx.ai.file.current.blobUrl}
				alt="Receipt"
			/>
		</Dialog.Trigger>
		<Dialog.Content showCloseButton={false} class="mx-auto w-fit border-0 bg-transparent p-0">
			<Dialog.Close>
				<img
					class="max-h-[calc(100vh-10rem)] scale-150 rounded-md"
					src={ctx.ai.file.current.blobUrl}
					alt="Receipt"
				/>
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Root>
{/if}
