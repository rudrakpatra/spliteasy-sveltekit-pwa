<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';

	let {
		open = $bindable(false),
		onConfirm,
		onCancel
	}: {
		open: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="w-64">
		<Dialog.Header>
			<Dialog.Title>Change group?</Dialog.Title>
			<Dialog.Description>
				Changing groups will clear all payers, items, and splits. This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex flex-row justify-center">
			<Dialog.Close onclick={onCancel}>
				<Button variant="outline">Cancel</Button>
			</Dialog.Close>
			<Dialog.Close onclick={onConfirm}>
				<Button variant="destructive">Clear</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
