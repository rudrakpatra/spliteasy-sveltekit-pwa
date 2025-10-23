<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';

	const ctx = getExpenseFormContext();
	const { form } = ctx;
	const { form: formData } = form;
</script>

<Form.Field {form} name="name">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Expense Name</Form.Label>
			<Input
				{...props}
				class="w-full"
				placeholder="Expense Name"
				bind:value={$formData.name}
				autocomplete="off"
			/>
		{/snippet}
	</Form.Control>
	<Form.Description>Choose a name for your expense</Form.Description>
	<Form.FieldErrors />
</Form.Field>
