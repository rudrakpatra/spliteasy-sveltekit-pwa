<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Button } from '$lib/components/ui/button';
	import { categories } from '$lib/shared/category/category';
	import ChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import CategoryDrawer from '../drawers/category-drawer.svelte';

	const ctx = getExpenseFormContext();
	const { form } = ctx;
	const { form: formData } = form;

	let categoryDrawerOpen = $state(false);

	const selectedCategoryName = $derived(
		Object.values(categories).find((c) => c.code === $formData.category)?.name || 'Select Category'
	);
</script>

<Form.Field {form} name="category">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Category</Form.Label>
			<Button
				{...props}
				variant="outline"
				type="button"
				onclick={() => {
					categoryDrawerOpen = true;
				}}
			>
				{selectedCategoryName}
				<ChevronDown />
			</Button>
		{/snippet}
	</Form.Control>
	<Form.Description>Choose category for this expense</Form.Description>
	<Form.FieldErrors />
</Form.Field>

<CategoryDrawer bind:open={categoryDrawerOpen} />
