<script lang="ts">
	import type { PageData } from './$types';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import * as CTX from './context.svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import ExpenseForm from './expense-form.svelte';
	import GroupChangeDialog from './group-change-dialog.svelte';
	import { CURRENCY_MAP, type CurrencyCode } from '$lib/shared/currency/currency-codes';
	import type { Uuid } from '$lib/shared/schema/uuid';
	import type { UserId } from '$lib/shared/schema/user';
	import { categorySchema, type CategoryCode } from '$lib/shared/category/category';
	import { currencyCodeSchema } from '$lib/shared/currency/currency';

	let { data }: { data: PageData } = $props();

	// Setup tRPC
	const api = trpc(page, data.queryClient);
	const utils = api.createUtils();

	const aiAnalyzeMutation = api.ai.analyze.createMutation();

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

	// AI/Receipt state
	let aiPendingFields = $state<SvelteSet<CTX.AnalyzeDataKey>>(new SvelteSet());
	let receiptFile = $state<File | null>(null);
	let receiptBlobUrl = $state<string | undefined>(undefined);
	let receiptPrompt = $state('');

	// Form state
	let formName = $state('');
	let formNotes = $state('');
	let formCategoryCode = $state<CategoryCode>('OTHER');
	let formCurrency = $state<CurrencyCode | undefined>(undefined);
	let formGroupId = $state<Uuid | undefined>(undefined);

	// Group state
	let showGroupChangeDialog = $state(false);
	let pendingGroupId = $state<Uuid | undefined>(undefined);

	// Collections
	const payers = $state(new SvelteMap<UserId, CTX.Payer>());
	const items = $state(new SvelteMap<CTX.ItemId, CTX.Item>());
	const splits = $state(new SvelteMap<CTX.SplitId, CTX.Split>());

	function setReceiptFile(file: File | null) {
		if (receiptBlobUrl) {
			URL.revokeObjectURL(receiptBlobUrl);
		}
		receiptFile = file;
		receiptBlobUrl = file ? URL.createObjectURL(file) : undefined;
	}

	async function analyzeReceipt() {
		if (!receiptBlobUrl) return;

		try {
			const response = await fetch(receiptBlobUrl);
			const blob = await response.blob();
			const reader = new FileReader();

			reader.onloadend = () => {
				$aiAnalyzeMutation.mutate(
					{
						imageUrl: reader.result as string,
						prompt: receiptPrompt
					},
					{
						onSuccess: (result) => {
							// Apply AI updates

							// Name
							if (result.data.name && aiPendingFields.has('name')) formName = result.data.name;

							// Currency
							if (
								currencyCodeSchema.safeParse(result.data.currencyCode).success &&
								aiPendingFields.has('currencyCode')
							)
								formCurrency = result.data.currencyCode;

							// Category
							if (
								result.data.categoryCode &&
								categorySchema.safeParse(result.data.categoryCode).success &&
								aiPendingFields.has('categoryCode')
							)
								formCategoryCode = result.data.categoryCode;

							// Notes
							if (result.data.notes && aiPendingFields.has('notes')) formNotes = result.data.notes;

							// Items
							if (result.data.items?.length > 0 && aiPendingFields.has('items')) {
								items.clear();
								for (const item of result.data.items) {
									const itemId = CTX.generateItemId();
									items.set(itemId, {
										name: item.name,
										amount: item.amount,
										selected: false
									});
								}
							}

							// Splits
							if (result.data.splits?.length > 0 && aiPendingFields.has('splits')) {
								splits.clear();
								// for (const split of result.data.splits) {
								// 	const splitId = CTX.generateSplitId();
								// 	splits.set(splitId, {
								// 		itemIds: new SvelteSet(split.itemNames.map((name) => CTX.generateItemId())),
								// 		shares: new SvelteMap(split.shares.map((share) => [share.userId, share.amount]))
								// 	});
								// }
							}

							aiPendingFields.clear();
							toast.success('Receipt analyzed successfully');
						},
						onError: (error) => {
							toast.error('Failed to analyze receipt', {
								description: error.message
							});
							cancelAnalysis();
						}
					}
				);
			};

			// set all aiPendingFields
			aiPendingFields.add('name');
			aiPendingFields.add('currencyCode');
			aiPendingFields.add('categoryCode');
			aiPendingFields.add('notes');
			aiPendingFields.add('items');

			reader.readAsDataURL(blob);
		} catch (error) {
			toast.error('Failed to read receipt file');
			cancelAnalysis();
		}
	}

	function cancelAnalysis() {
		aiPendingFields.clear();
		$aiAnalyzeMutation.reset();
	}

	function handleGroupChange(newGroupId: Uuid) {
		// Early return if selecting the same group
		if (formGroupId === newGroupId) {
			return;
		}

		const hasData = payers.size > 0 || items.size > 0 || splits.size > 0;

		// Switch with confirmation dialog
		if (hasData && formGroupId) {
			pendingGroupId = newGroupId;
			showGroupChangeDialog = true;
		} else {
			applyGroupChange(newGroupId);
		}
	}

	function applyGroupChange(newGroupId: Uuid) {
		formGroupId = newGroupId;

		// Clear all data
		payers.clear();
		items.clear();
		splits.clear();

		// Reset form
		formName = '';
		formNotes = '';

		showGroupChangeDialog = false;
		pendingGroupId = undefined;
	}

	function cancelGroupChange() {
		showGroupChangeDialog = false;
		pendingGroupId = undefined;
	}

	// Set context
	CTX.setExpenseFormContext({
		ai: {
			file: {
				get current() {
					return receiptFile && receiptBlobUrl
						? { file: receiptFile, blobUrl: receiptBlobUrl }
						: null;
				},
				set: setReceiptFile
			},
			prompt: {
				get current() {
					return receiptPrompt;
				},
				set: (value: string) => {
					receiptPrompt = value;
				}
			},
			get pendingFields() {
				return aiPendingFields;
			},
			get isAnalyzing() {
				return $aiAnalyzeMutation.isPending;
			},
			analyze: analyzeReceipt,
			cancel: cancelAnalysis
		},
		name: {
			get current() {
				return formName;
			},
			set: (value: string) => {
				aiPendingFields.delete('name');
				formName = value;
			}
		},
		currency: {
			get current() {
				return formCurrency;
			},
			get digits() {
				return formCurrency ? (CURRENCY_MAP.get(formCurrency)?.digits ?? 2) : 2;
			},
			set: (value: CurrencyCode | undefined) => {
				aiPendingFields.delete('currencyCode');
				formCurrency = value;
			}
		},
		groupId: {
			get current() {
				return formGroupId ?? ('' as Uuid);
			},
			set: handleGroupChange
		},
		payers,
		items,
		splits,
		notes: {
			get current() {
				return formNotes;
			},
			set: (value: string) => {
				aiPendingFields.delete('notes');
				formNotes = value;
			}
		},
		categoryCode: {
			get current() {
				return formCategoryCode;
			},
			set: (value: CategoryCode) => {
				aiPendingFields.delete('categoryCode');
				formCategoryCode = value;
			}
		},
		get submitting() {
			return $createExpense.isPending;
		}
	});

	$effect(() => {
		items && aiPendingFields.delete('items');
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
