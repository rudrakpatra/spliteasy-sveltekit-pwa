<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Receipt from '@tabler/icons-svelte/icons/receipt';
	import Upload from '@tabler/icons-svelte/icons/upload';
	import Scan from '@tabler/icons-svelte/icons/scan';

	const ctx = getExpenseFormContext();
	const { form, receipt } = ctx;
</script>

<Form.Field {form} name="receiptImageUrl">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Do you have a receipt?</Form.Label>

			<Avatar.Root
				class="h-auto min-h-32 w-full overflow-hidden rounded-lg border border-border shadow-xs"
			>
				<Avatar.Image class="aspect-auto w-full rounded-lg" src={receipt.blobUrl} alt="Receipt" />
				<Avatar.Fallback
					class="flex aspect-auto min-h-32 items-center justify-center rounded-lg bg-transparent shadow-xs"
				>
					<Receipt class="block stroke-muted-foreground" />
				</Avatar.Fallback>
			</Avatar.Root>

			<div class="flex gap-2">
				<Button class="relative flex-1" variant="outline" type="button">
					<label for="receipt-upload" class="absolute inset-0 cursor-pointer"></label>
					<Input
						id="receipt-upload"
						class="hidden"
						accept="image/*"
						type="file"
						onchange={receipt.onChange}
						disabled={receipt.isUploading}
					/>
					<Upload /> Upload
				</Button>

				<Button class="relative flex-1" variant="outline" type="button">
					<label for="receipt-scan" class="absolute inset-0 cursor-pointer"></label>
					<Input
						id="receipt-scan"
						class="hidden"
						accept="image/*"
						capture="environment"
						type="file"
						onchange={receipt.onChange}
						disabled={receipt.isUploading}
					/>
					<Scan /> Scan
				</Button>
			</div>
		{/snippet}
	</Form.Control>
	<Form.Description>Upload a receipt image for this expense</Form.Description>
	<Form.FieldErrors />
</Form.Field>
