<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';

	const ctx = getExpenseFormContext();
	const { form, ai } = ctx;
	const { form: formData } = form;
</script>

<Form.Field {form} name="name">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Expense Name</Form.Label>
			<div class={cn(ai.aiPendingFields.has('name') && 'ai-pending')}>
				<Input
					{...props}
					placeholder="Expense Name"
					bind:value={$formData.name}
					autocomplete="off"
					data-scroll-into-view="true"
					oninput={() => ai.markFieldAsTouched('name')}
					class="w-full"
				/>
			</div>
		{/snippet}
	</Form.Control>
	<Form.Description>Choose a name for your expense</Form.Description>
	<Form.FieldErrors />
</Form.Field>
