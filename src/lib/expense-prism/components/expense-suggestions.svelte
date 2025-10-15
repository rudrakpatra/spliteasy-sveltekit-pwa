<script lang="ts">
    import type { ParticipantContext, AutocompleteSuggestion } from '$lib/expense-prism/parser/types';
    import * as DataList from '$lib/components/ui/data-list';
    import VisualViewportView from '$lib/components/ui/visual-viewport-view/visual-viewport-view.svelte';
    import { Badge } from '$lib/components/ui/badge';
    import Plus from '@tabler/icons-svelte/icons/plus';
    import Minus from '@lucide/svelte/icons/minus';
    import X from '@lucide/svelte/icons/x';
    import Divide from '@lucide/svelte/icons/divide';
    import Percent from '@lucide/svelte/icons/percent';

    interface Props {
        inputId: string;
        context: ParticipantContext;
        expectedType: string;
    }

    let { inputId, context, expectedType }: Props = $props();

    let showMath = $derived(expectedType === 'expression' || expectedType === 'operator-for');

    let suggestions = $derived.by(() => {
        const items: AutocompleteSuggestion[] = [];
        
        if (showMath) {
            return [
                { type: 'math' as const, value: '+', label: '+', priority: 100 },
                { type: 'math' as const, value: '-', label: '-', priority: 100 },
                { type: 'math' as const, value: '*', label: '×', priority: 100 },
                { type: 'math' as const, value: '/', label: '÷', priority: 100 },
                { type: 'math' as const, value: '%', label: '%', priority: 100 }
            ];
        }

        // Add keywords based on expected type
        if (expectedType === 'start') {
            items.push({ type: 'keyword', value: 'Add ', label: 'Add', priority: 95 });
        }
        
        if (expectedType === 'keyword-paid') {
            items.push({ type: 'keyword', value: 'paid ', label: 'paid', priority: 100 });
        }
        
        if (expectedType === 'operator-for') {
            items.push({ type: 'operator', value: 'for ', label: 'for', priority: 100 });
        }
        
        if (expectedType === 'keyword-split' || expectedType === 'operator-for') {
            items.push({ type: 'keyword', value: 'Split ', label: 'Split', priority: 90 });
            items.push({ type: 'keyword', value: 'Split evenly among ', label: 'Split evenly among', priority: 95 });
        }
        
        if (expectedType === 'operator-and') {
            items.push({ type: 'operator', value: 'and ', label: 'and', priority: 100 });
        }

        // Add members based on context
        if (expectedType === 'start' || expectedType === 'member-list' || expectedType === 'operator-and') {
            context.members.forEach(member => {
                items.push({
                    type: 'member',
                    value: member + ' ',
                    label: member,
                    priority: expectedType === 'start' ? 100 : 90
                });
            });
        }

        return items.sort((a, b) => b.priority - a.priority);
    });
</script>

<VisualViewportView forceOverlaysContent>
    <DataList.Root
        {inputId}
        class="absolute inset-0 top-auto flex h-12 items-start gap-3 overflow-auto border-t border-border bg-background px-3 py-1 text-foreground"
    >
        {#if showMath}
            <DataList.Option value="+">
                <Badge class="rounded-full p-2 px-3"><Plus /></Badge>
            </DataList.Option>
            <DataList.Option value="-">
                <Badge class="rounded-full p-2 px-3"><Minus /></Badge>
            </DataList.Option>
            <DataList.Option value="*">
                <Badge class="rounded-full p-2 px-3"><X /></Badge>
            </DataList.Option>
            <DataList.Option value="/">
                <Badge class="rounded-full p-2 px-3"><Divide /></Badge>
            </DataList.Option>
            <DataList.Option value="%">
                <Badge class="rounded-full p-2 px-3"><Percent /></Badge>
            </DataList.Option>
        {:else}
            {#each suggestions as suggestion}
                <DataList.Option value={suggestion.value}>
                    {suggestion.label}
                </DataList.Option>
            {/each}
        {/if}
    </DataList.Root>
</VisualViewportView>
