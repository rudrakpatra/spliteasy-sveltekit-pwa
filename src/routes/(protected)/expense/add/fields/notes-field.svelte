<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { cn } from '$lib/utils';

	const ctx = getExpenseFormContext();
	const { form, ai } = ctx;
	const { form: formData } = form;
</script>

<Form.Field {form} name="notes">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Notes</Form.Label>
			<div class={cn(ai.aiPendingFields.has('notes') && 'ai-pending')}>
				<Textarea
					{...props}
					bind:value={$formData.notes}
					placeholder="Add any additional notes..."
					data-scroll-into-view="true"
					oninput={() => ai.markFieldAsTouched('notes')}
				/>
			</div>
		{/snippet}
	</Form.Control>
	<Form.Description>Notes for this expense</Form.Description>
	<Form.FieldErrors />
</Form.Field>
