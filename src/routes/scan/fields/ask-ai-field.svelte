<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Upload from '@tabler/icons-svelte/icons/upload';
	import Scan from '@tabler/icons-svelte/icons/scan';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import Send2 from '@tabler/icons-svelte/icons/send-2';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { toast } from 'svelte-sonner';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import AiReceiptDialog from './ai-receipt-dialog.svelte';

	const ctx = getExpenseFormContext();
	const { ai } = ctx;

	const openScan = () => {
		const input = document.getElementById('receipt-scan') as HTMLInputElement;
		input.click();
	};
	const openUpload = () => {
		const input = document.getElementById('receipt-upload') as HTMLInputElement;
		input.click();
	};

	const handleAnalyze = async () => {
		if (!ai.file) {
			toast.error('Please upload a receipt first');
			return;
		}

		ai.analyze();
	};
</script>

<div class="space-y-2">
	<Label>Ask AI</Label>
	<InputGroup.Root>
		{#if ai.file.current}
			<InputGroup.Addon align="block-start">
				<AiReceiptDialog />
			</InputGroup.Addon>
			<InputGroup.Textarea
				value={ai.prompt.current}
				oninput={(e) => ai.prompt.set(e.currentTarget.value)}
				placeholder="Analyze this receipt & extract all items with amounts."
				data-scroll-into-view="true"
			/>
		{:else}
			<InputGroup.Textarea
				value={ai.prompt.current}
				oninput={(e) => ai.prompt.set(e.currentTarget.value)}
				placeholder="Describe your expense. You can scan or upload a receipt if you have one."
				data-scroll-into-view="true"
			/>
		{/if}

		<InputGroup.Addon align="block-end">
			<InputGroup.Button
				class="ml-auto"
				onclick={handleAnalyze}
				disabled={!(ai.prompt.current || ai.file.current) || ai.isAnalyzing}
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

	{#if ai.file.current}
		<div class="grid grid-cols-[1fr_1fr_auto] gap-2">
			<Button onclick={openScan} variant="outline" type="button" disabled={ai.isAnalyzing}>
				<Scan /> Scan
			</Button>
			<Button onclick={openUpload} variant="outline" type="button" disabled={ai.isAnalyzing}>
				<Upload /> Upload
			</Button>
			<Button variant="outline" type="button" onclick={() => ai.file.set(null)}>
				<Trash />
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-[1fr_1fr] gap-2">
			<Button onclick={openScan} variant="outline" type="button" disabled={ai.isAnalyzing}>
				<Scan /> Scan
			</Button>
			<Button onclick={openUpload} variant="outline" type="button" disabled={ai.isAnalyzing}>
				<Upload /> Upload
			</Button>
		</div>
	{/if}
	<p class="text-xs text-muted-foreground">Analyze receipts and split the expense</p>
</div>
<!-- hidden inputs for file upload -->
<div class="hidden">
	<Input
		id="receipt-scan"
		accept="image/*"
		capture="environment"
		type="file"
		onchange={(e) => ai.file.set(e.currentTarget.files?.[0] ?? null)}
		disabled={ai.isAnalyzing}
	/>
	<Input
		id="receipt-upload"
		accept="image/*"
		type="file"
		onchange={(e) => ai.file.set(e.currentTarget.files?.[0] ?? null)}
		disabled={ai.isAnalyzing}
	/>
</div>
