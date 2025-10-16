<!-- routes/expense/create/components/receipt-upload.svelte -->
<script lang="ts">
    import * as Form from '$lib/components/ui/form';
    import * as Avatar from '$lib/components/ui/avatar';
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import Receipt from '@tabler/icons-svelte/icons/receipt';
    import Upload from '@tabler/icons-svelte/icons/upload';
    import Scan from '@tabler/icons-svelte/icons/scan';

    let { form, isPending }: { form: any; isPending: boolean } = $props();

    let receiptBlobUrl = $state<string>('');
    let receiptFile = $state<File | null>(null);

    const handleChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            if (receiptBlobUrl) {
                URL.revokeObjectURL(receiptBlobUrl);
            }
            receiptFile = file;
            receiptBlobUrl = URL.createObjectURL(file);
        }
    };
</script>

<Form.Field {form} name="receiptImageUrl">
    <Form.Control>
        {#snippet children({ props })}
            <Form.Label>Do you have a receipt?</Form.Label>
            <Avatar.Root class="h-auto min-h-32 w-full overflow-hidden rounded-lg border border-border shadow-xs">
                <Avatar.Image class="aspect-auto w-full rounded-lg" src={receiptBlobUrl} alt="Receipt" />
                <Avatar.Fallback class="flex aspect-auto min-h-32 items-center justify-center rounded-lg bg-transparent shadow-xs">
                    <Receipt class="block stroke-muted-foreground" />
                </Avatar.Fallback>
            </Avatar.Root>

            <Button class="relative" variant="outline" type="button">
                <label for="receipt-upload" class="absolute inset-0">
                    <Input id="receipt-upload" class="hidden" accept="image/*" type="file" onchange={handleChange} disabled={isPending} />
                </label>
                <Upload /> Upload
            </Button>
            <Button class="relative" variant="outline" type="button">
                <label for="receipt-scan" class="absolute inset-0"></label>
                <Input id="receipt-scan" class="hidden" accept="image/*" capture="environment" type="file" onchange={handleChange} disabled={isPending} />
                <Scan /> Scan
            </Button>
        {/snippet}
    </Form.Control>
    <Form.Description>Upload a receipt image for this expense</Form.Description>
    <Form.FieldErrors />
</Form.Field>
