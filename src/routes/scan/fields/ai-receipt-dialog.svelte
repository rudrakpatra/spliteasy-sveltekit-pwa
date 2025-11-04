<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import DialogTrigger from '$lib/components/ui/dialog/dialog-trigger.svelte';
	const ctx = getExpenseFormContext();
</script>

{#if ctx.ai.file.current}
	<Dialog.Root>
		<DialogTrigger>
			<img
				class="aspect-square max-h-16 rounded-md object-cover"
				src={ctx.ai.file.current.blobUrl}
				alt="Receipt"
			/>
		</DialogTrigger>
		<Dialog.Content showCloseButton={false} class="w-fit p-0">
			<Dialog.Close>
				<img class="rounded-md" src={ctx.ai.file.current.blobUrl} alt="Receipt" />
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Root>
{/if}
