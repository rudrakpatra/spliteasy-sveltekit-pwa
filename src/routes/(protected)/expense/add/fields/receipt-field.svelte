<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Upload from '@tabler/icons-svelte/icons/upload';
	import Scan from '@tabler/icons-svelte/icons/scan';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import Send2 from '@tabler/icons-svelte/icons/send-2';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { toast } from 'svelte-sonner';
	import { Spinner } from '$lib/components/ui/spinner';

	const ctx = getExpenseFormContext();
	const { form, receipt, ai } = ctx;

	const openScan = () => {
		const input = document.getElementById('receipt-scan') as HTMLInputElement;
		input.click();
	};
	const openUpload = () => {
		const input = document.getElementById('receipt-upload') as HTMLInputElement;
		input.click();
	};

	const handleAnalyze = async () => {
		if (!receipt.blobUrl) {
			toast.error('Please upload a receipt first');
			return;
		}

		const prompt = inputValue || 'Analyze this receipt & extract all items with amounts.';
		await ai.analyzeReceipt(receipt.blobUrl, prompt);
	};
	let inputValue = $state('');
</script>

<Form.Field {form} name="receiptImageUrl">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Ask AI</Form.Label>

			<InputGroup.Root>
				{#if receipt.blobUrl}
					<InputGroup.Addon align="block-start">
						<img class="aspect-auto w-full rounded-lg" src={receipt.blobUrl} alt="Receipt" />
					</InputGroup.Addon>
					<InputGroup.Textarea
						value={inputValue}
						oninput={(e) => (inputValue = e.currentTarget.value)}
						placeholder="Analyze this receipt & extract all items with amounts."
						data-scroll-into-view="true"
					/>
				{:else}
					<InputGroup.Textarea
						class="min-h-[50vh]"
						oninput={(e) => (inputValue = e.currentTarget.value)}
						placeholder="Describe your expense. You can scan or upload a receipt if you have one."
						data-scroll-into-view="true"
					/>
				{/if}

				<InputGroup.Addon align="block-end">
					<InputGroup.Button
						class="ml-auto"
						onclick={handleAnalyze}
						disabled={ai.isAnalyzing || !receipt.blobUrl}
						size="sm"
						variant="default"
					>
						{#if ai.isAnalyzing}
							<Spinner /> Loading...
						{:else}
							<Send2 /> Analyze
						{/if}
					</InputGroup.Button>
				</InputGroup.Addon>
			</InputGroup.Root>
			{#if receipt.blobUrl}
				<div class="grid grid-cols-[1fr_1fr_auto] gap-2">
					<Button onclick={openScan} variant="outline" type="button">
						<Scan /> Scan
					</Button>
					<Button onclick={openUpload} variant="outline" type="button">
						<Upload /> Upload
					</Button>
					<Button variant="outline" type="button" onclick={receipt.onRemove}>
						<Trash />
					</Button>
				</div>
			{:else}
				<div class="grid grid-cols-[1fr_1fr] gap-2">
					<Button onclick={openScan} variant="outline" type="button">
						<Scan /> Scan
					</Button>
					<Button onclick={openUpload} variant="outline" type="button">
						<Upload /> Upload
					</Button>
				</div>
			{/if}
		{/snippet}
	</Form.Control>
	<Form.Description>Analyze receipts and split the expense</Form.Description>
	<Form.FieldErrors />
</Form.Field>

<Input
	id="receipt-scan"
	class="hidden"
	accept="image/*"
	capture="environment"
	type="file"
	onchange={receipt.onChange}
	disabled={receipt.isUploading}
/>
<Input
	id="receipt-upload"
	class="hidden"
	accept="image/*"
	type="file"
	onchange={receipt.onChange}
	disabled={receipt.isUploading}
/>
