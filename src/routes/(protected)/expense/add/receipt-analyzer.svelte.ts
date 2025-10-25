import { toast } from 'svelte-sonner';
import type { SuperForm } from 'sveltekit-superforms';
import type { createExpenseSchema } from '$lib/shared/schema/expense';
import type z from 'zod';
import { generateId } from './context.svelte';
import { SvelteSet } from 'svelte/reactivity';

type ExpenseFormData = z.infer<typeof createExpenseSchema>;

export class ReceiptAnalyzer {
    private abortController: AbortController | null = null;

    // Use SvelteSet instead of regular Set for reactivity
    aiPendingFields = $state(new SvelteSet<string>());
    userTouchedFields = $state(new SvelteSet<string>());

    isAnalyzing = $state(false);

    constructor(private form: SuperForm<ExpenseFormData>) { }

    // Call this from input handlers when user interacts with fields
    markFieldAsTouched(fieldName: string) {
        this.userTouchedFields.add(fieldName);
        this.aiPendingFields.delete(fieldName);
    }

    // Convert blob URL to base64 for API
    private async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Main analysis function
    async analyzeReceipt(blobUrl: string, userPrompt?: string) {
        if (this.isAnalyzing) {
            this.abortController?.abort();
        }

        this.abortController = new AbortController();
        this.isAnalyzing = true;

        // Clear and rebuild the set to trigger reactivity
        this.aiPendingFields.clear();
        this.aiPendingFields.add('name');
        this.aiPendingFields.add('currency');
        this.aiPendingFields.add('category');
        this.aiPendingFields.add('notes');
        this.aiPendingFields.add('items');

        try {
            // Convert blob URL to base64
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            const base64Image = await this.blobToBase64(blob);

            // Call AI API
            const apiResponse = await fetch('/api/analyze-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: base64Image,
                    prompt: userPrompt
                }),
                signal: this.abortController.signal
            });

            if (!apiResponse.ok) {
                throw new Error('Analysis failed');
            }

            const { data } = await apiResponse.json();

            // Apply updates only to non-touched fields
            this.applyAIUpdates(data);

            toast.success('Receipt analyzed successfully');
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Receipt analysis error:', error);
                toast.error('Failed to analyze receipt');
            }
        } finally {
            this.isAnalyzing = false;
            this.aiPendingFields.clear();
        }
    }

    private applyAIUpdates(data: any) {
        // Update name
        if (data.name && !this.userTouchedFields.has('name')) {
            this.form.form.update(($form) => ({ ...$form, name: data.name }));
            this.aiPendingFields.delete('name');
        }

        // Update currency
        if (data.currency && !this.userTouchedFields.has('currency')) {
            this.form.form.update(($form) => ({ ...$form, currency: data.currency }));
            this.aiPendingFields.delete('currency');
        }

        // Update category
        if (data.category && !this.userTouchedFields.has('category')) {
            this.form.form.update(($form) => ({ ...$form, category: data.category }));
            this.aiPendingFields.delete('category');
        }

        // Update notes
        if (data.notes && !this.userTouchedFields.has('notes')) {
            this.form.form.update(($form) => ({ ...$form, notes: data.notes }));
            this.aiPendingFields.delete('notes');
        }

        // Update items array
        if (data.items && data.items.length > 0 && !this.userTouchedFields.has('items')) {
            const items = data.items.map((item: any) => ({
                id: generateId(),
                name: item.name,
                amountExpression: item.amountExpression
            }));

            this.form.form.update(($form) => ({ ...$form, items }));
            this.aiPendingFields.delete('items');
        }

        // Final cleanup
        this.aiPendingFields.clear();
    }

    cancel() {
        this.abortController?.abort();
        this.isAnalyzing = false;
        this.aiPendingFields.clear();
    }
}
