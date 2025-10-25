<script lang="ts">
	import type { PageData } from './$types';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { createExpenseSchema, transformedCreateExpenseSchema } from '$lib/shared/schema/expense';
	import { toast } from 'svelte-sonner';
	import { type Uuid } from '$lib/shared/schema/uuid';
	import { generateId, setExpenseFormContext } from './context.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import ExpenseForm from './expense-form.svelte';
	import GroupChangeDialog from './group-change-dialog.svelte';
	import ContextViewer from './context-viewer.svelte';
	import { evaluate } from '$lib/shared/schema/math';
	import { CURRENCY_MAP } from '$lib/shared/currency/currency-codes';
	import { ReceiptAnalyzer } from './receipt-analyzer.svelte';
	import { upload } from '@vercel/blob/client';
	import type { PutBlobResult } from '@vercel/blob';

	let { data }: { data: PageData } = $props();

	// Setup tRPC
	const api = trpc(page, data.queryClient);
	const utils = api.createUtils();

	// Setup mutation
	const createExpense = api.expense.insert.createMutation({
		onSuccess: (expense) => {
			utils.expense.getProposed.invalidate();
			goto(`/expense/${expense.id}`);
		},
		onError: (error) => {
			toast.error('Failed to create expense', { description: error.message });
		}
	});

	// Setup Superforms
	const form = superForm(defaults(zod4(createExpenseSchema)), {
		SPA: true,
		dataType: 'json',
		validators: false,
		resetForm: false,
		onUpdate({ form }) {
			if (form.valid) {
				$createExpense.mutate(transformedCreateExpenseSchema.parse(form.data));
			}
		}
	});

	const { form: formData } = form;

	// Receipt state
	let receiptBlobUrl = $state<string | undefined>(undefined);
	let receiptFile = $state<File | null>(null);
	let isUploadingReceipt = $state(false);
	let uploadedBlob = $state<PutBlobResult | null>(null);

	// AI Analyzer instance
	const aiAnalyzer = new ReceiptAnalyzer(form);

	async function handleReceiptChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image must be less than 5MB');
			return;
		}

		// Clean up previous blob URL
		if (receiptBlobUrl) {
			URL.revokeObjectURL(receiptBlobUrl);
		}

		receiptFile = file;
		receiptBlobUrl = URL.createObjectURL(file);

		// Optional: Auto-upload to Vercel Blob
		// try {
		//     isUploadingReceipt = true;
		//     const blob = await upload(file.name, file, {
		//         access: 'public',
		//         handleUploadUrl: '/api/upload/receipt',
		//     });
		//     uploadedBlob = blob;
		//     toast.success('Receipt uploaded successfully');
		// } catch (error) {
		//     toast.error('Failed to upload receipt');
		//     console.error(error);
		// } finally {
		//     isUploadingReceipt = false;
		// }
	}

	function removeReceipt() {
		if (receiptBlobUrl) {
			URL.revokeObjectURL(receiptBlobUrl);
		}
		receiptBlobUrl = undefined;
		receiptFile = null;
		uploadedBlob = null;

		// Cancel any ongoing AI analysis
		aiAnalyzer.cancel();
	}

	// Selection state
	const itemsSelected = new SvelteSet<Uuid>();
	const splitsSelected = new SvelteSet<Uuid>();

	// Group change confirmation
	let showGroupChangeDialog = $state(false);
	let pendingGroupId = $state<string | undefined>(undefined);

	function handleGroupChange(newGroupId: string) {
		// Early return if selecting the same group
		if ($formData.groupId === newGroupId) {
			return;
		}
		const hasData =
			$formData.payers.length > 0 || itemsSelected.size > 0 || splitsSelected.size > 0;
		// switch with confirmation dialog
		if (hasData && $formData.groupId) {
			pendingGroupId = newGroupId;
			showGroupChangeDialog = true;
		} else {
			applyGroupChange(newGroupId);
		}
	}

	function applyGroupChange(newGroupId: string) {
		const itemId = generateId();
		formData.update((current) => ({
			...current,
			groupId: newGroupId,
			payers: [],
			items: [
				{
					id: itemId,
					name: '',
					amountExpression: ''
				}
			],
			splits: [
				{
					id: generateId(),
					itemIds: [itemId],
					shares: []
				}
			]
		}));
		itemsSelected.clear();
		splitsSelected.clear();

		showGroupChangeDialog = false;
		pendingGroupId = undefined;
	}

	function cancelGroupChange() {
		showGroupChangeDialog = false;
		pendingGroupId = undefined;
	}

	// Set context
	setExpenseFormContext({
		form,
		get submitting() {
			return $createExpense.isPending;
		},
		currency: {
			get current() {
				return $formData.currency;
			},
			get digits() {
				return CURRENCY_MAP.get($formData.currency)?.digits ?? 2;
			}
		},
		payers: {
			get total() {
				//if any payer amount is NaN return NaN
				const total = $formData.payers.reduce(
					(total, payer) => total + (payer.amountExpression ? evaluate(payer.amountExpression) : 0),
					0
				);
				return isNaN(total) ? NaN : total;
			}
		},
		group: {
			get current() {
				return $formData.groupId;
			},
			onChange: handleGroupChange
		},
		receipt: {
			get blobUrl() {
				return receiptBlobUrl;
			},
			get uploadedUrl() {
				return uploadedBlob?.url;
			},
			get file() {
				return receiptFile;
			},
			get isUploading() {
				return isUploadingReceipt;
			},
			onChange: handleReceiptChange,
			onRemove: removeReceipt
		},
		items: {
			get total() {
				return $formData.items.reduce(
					(total, item) => total + (item.amountExpression ? evaluate(item.amountExpression) : 0),
					0
				);
			},
			selected: itemsSelected
		},
		splits: {
			selected: splitsSelected
		},
		ai: aiAnalyzer // Add AI analyzer to context
	});
</script>

<svelte:head>
	<title>Create Expense - SplitEasy</title>
</svelte:head>

<ExpenseForm />

<GroupChangeDialog
	bind:open={showGroupChangeDialog}
	onConfirm={() => applyGroupChange(pendingGroupId!)}
	onCancel={cancelGroupChange}
/>
<!-- <ContextViewer /> -->
