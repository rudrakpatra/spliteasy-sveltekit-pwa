<script lang="ts">
	import type { PageData } from './$types';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import * as CTX from './context.svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import ExpenseForm from './expense-form.svelte';
	import { CURRENCY_MAP, type CurrencyCode } from '$lib/shared/currency/currency-codes';
	import { currencyCodeSchema } from '$lib/shared/currency/currency';
	import { createOneTimeExpenseProposalSchema } from '$lib/shared/schema/expense';
	import { evaluateAmountExpression } from '$lib/shared/schema/math';

	let { data }: { data: PageData } = $props();

	// Setup tRPC
	const api = trpc(page, data.queryClient);

	const aiAnalyzeMutation = api.ai.analyze.createMutation();

	// AI/Receipt state
	let aiPendingFields = $state<SvelteSet<CTX.AnalyzeDataKey>>(new SvelteSet());
	let receiptFile = $state<File | null>(null);
	let receiptBlobUrl = $state<string | undefined>(undefined);
	let receiptPrompt = $state('');

	// Form state
	let formCurrency = $state<CurrencyCode | undefined>(undefined);

	// Collections
	const participants = $state(
		new SvelteMap<CTX.Id, CTX.Participant>([
			[
				CTX.generateId(),
				{
					name: '',
					amount: ''
				}
			]
		])
	);
	const itemId = CTX.generateId();
	const items = $state(
		new SvelteMap<CTX.Id, CTX.Item>([
			[
				itemId,
				{
					name: '',
					amount: '',
					selected: false
				}
			]
		])
	);

	const splits = $state(
		new SvelteMap<CTX.Id, CTX.Split>([
			[
				CTX.generateId(),
				{
					itemIds: new SvelteSet([itemId]),
					shares: new SvelteMap()
				}
			]
		])
	);

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

							// Currency
							if (
								currencyCodeSchema.safeParse(result.data.currencyCode).success &&
								aiPendingFields.has('currencyCode')
							)
								formCurrency = result.data.currencyCode;

							// Items
							if (result.data.items?.length > 0 && aiPendingFields.has('items')) {
								splits.clear();
								items.clear();
								for (const item of result.data.items) {
									const itemId = CTX.generateId();
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
		participants,
		items,
		get remainingAmount() {
			const filledCount = Array.from(items.values()).filter((item) => item.amount !== '').length;
			const unfilledCount = items.size - filledCount;
			const itemAmount = Array.from(items.values()).reduce(
				(acc, item) => acc + (evaluateAmountExpression(item.amount) || 0),
				0
			);
			const participantAmount = Array.from(participants.values()).reduce(
				(acc, participant) => acc + (evaluateAmountExpression(participant.amount) || 0),
				0
			);
			const digits = formCurrency ? (CURRENCY_MAP.get(formCurrency)?.digits ?? 2) : 2;
			const remainingAmount = (participantAmount - itemAmount) / unfilledCount;
			return isNaN(remainingAmount) || !isFinite(remainingAmount)
				? (0).toFixed(digits)
				: remainingAmount.toFixed(digits);
		},
		splits,
		get parsed() {
			return createOneTimeExpenseProposalSchema.safeParse({
				currency: formCurrency,
				payers: Array.from(
					participants.entries().map(([k, v]) => ({ userId: k, amountExpression: v.amount }))
				),
				items: Array.from(
					items.entries().map(([k, v]) => ({
						id: k,
						name: v.name,
						amountExpression: v.amount || this.remainingAmount
					}))
				),
				splits: Array.from(
					splits.entries().map(([k, v]) => ({
						id: k,
						itemIds: Array.from(v.itemIds),
						shares: Array.from(
							v.shares.entries().map(([k, v]) => ({ userId: k, shareExpression: v }))
						)
					}))
				)
			});
		}
	});

	$effect(() => {
		items && aiPendingFields.delete('items');
	});
</script>

<svelte:head>
	<title>Create One Time Expense - SplitEasy</title>
</svelte:head>

<ExpenseForm />
