import { toast } from 'svelte-sonner';
import { type ExpenseFormContext, generateItemId } from './context.svelte';
import { SvelteSet } from 'svelte/reactivity';
import { trpc } from '$lib/trpc/client';

export function createReceiptAnalyzer(ctx: ExpenseFormContext) {
    // Use SvelteSet for reactivity
    const aiPendingFields = new SvelteSet<string>();
    const userTouchedFields = new SvelteSet<string>();

    // Create the mutation
    const analyzeMutation = trpc.ai.analyze.createMutation();

    // Convert blob URL to base64 for API
    async function blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Apply AI updates to context
    function applyAIUpdates(data: {
        name: string;
        currency: string;
        category?: string;
        notes?: string;
        items: Array<{
            name: string;
            amountExpression: string;
        }>;
        suggestedSplits?: Array<{
            itemNames: string[];
            shareExpression: string;
        }>;
    }) {
        // Update name
        if (data.name && !userTouchedFields.has('name')) {
            ctx.name = data.name;
            aiPendingFields.delete('name');
        }

        // Update currency
        if (data.currency && !userTouchedFields.has('currency')) {
            // Currency is read-only, skip or add setter
            aiPendingFields.delete('currency');
        }

        // Update category
        if (data.category && !userTouchedFields.has('category')) {
            ctx.categoryCode = data.category as any;
            aiPendingFields.delete('category');
        }

        // Update notes
        if (data.notes && !userTouchedFields.has('notes')) {
            ctx.notes = data.notes;
            aiPendingFields.delete('notes');
        }

        // Update items
        if (data.items && data.items.length > 0 && !userTouchedFields.has('items')) {
            ctx.items.clear();

            for (const item of data.items) {
                const itemId = generateItemId();
                ctx.items.set(itemId, {
                    name: item.name,
                    amount: item.amountExpression,
                    selected: false
                });
            }

            aiPendingFields.delete('items');
        }

        // Final cleanup
        aiPendingFields.clear();
    }

    // Main analysis function
    async function analyzeReceipt(blobUrl: string, userPrompt?: string) {
        // Clear and rebuild the set to trigger reactivity
        aiPendingFields.clear();
        aiPendingFields.add('name');
        aiPendingFields.add('currency');
        aiPendingFields.add('category');
        aiPendingFields.add('notes');
        aiPendingFields.add('items');

        try {
            // Convert blob URL to base64
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            const base64Image = await blobToBase64(blob);

            // Trigger mutation
            analyzeMutation.mutate(
                {
                    imageUrl: base64Image,
                    prompt: userPrompt
                }
            );
        } catch (error: any) {
            console.error('Receipt analysis error:', error);
            toast.error('Failed to analyze receipt');
            aiPendingFields.clear();
        }
    }

    // Mark field as touched
    function markFieldAsTouched(fieldName: string) {
        userTouchedFields.add(fieldName);
        aiPendingFields.delete(fieldName);
    }

    // Cancel analysis
    function cancel() {
        // tRPC doesn't expose abort directly, but reset will clear state
        analyzeMutation.reset();
        aiPendingFields.clear();
    }

    return {
        analyzeMutation,
        aiPendingFields,
        userTouchedFields,
        analyzeReceipt,
        markFieldAsTouched,
        cancel,
        // Derived state
        get isAnalyzing() {
            return analyzeMutation.isPending;
        }
    };
}

export type ReceiptAnalyzer = ReturnType<typeof createReceiptAnalyzer>;
