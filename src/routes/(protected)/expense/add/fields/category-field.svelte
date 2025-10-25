<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Button } from '$lib/components/ui/button';
	import { categories } from '$lib/shared/category/category';
	import ChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import CategoryDrawer from '../drawers/category-drawer.svelte';
	import { useCategorySuggestion } from '$lib/hooks/use-category-suggestion';
	import { Spinner } from '$lib/components/ui/spinner';
	import { cn } from '$lib/utils';

	const ctx = getExpenseFormContext();
	const { form, ai } = ctx;
	const { form: formData } = form;

	let categoryDrawerOpen = $state(false);

	//auto detect category
	const autoCategory = useCategorySuggestion();

	$effect(() => {
		if ($autoCategory.data && !$formData.category) {
			formData.update((current) => ({
				...current,
				category: $autoCategory.data
			}));
			ai.markFieldAsTouched('category');
		}
	});
</script>

<Form.Field {form} name="category">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Category</Form.Label>
			{#snippet trigger()}
				{@const category = Object.values(categories).find((c) => c.code === $formData.category)}
				<div class={cn('w-fit', ai.aiPendingFields.has('currency') && 'ai-pending')}>
					<Button
						{...props}
						variant="outline"
						type="button"
						onclick={() => {
							categoryDrawerOpen = true;
						}}
					>
						{#if category}
							<span class="text-xl">{category.icon}</span>{category.name}
						{:else if $autoCategory.isLoading}
							<Spinner />Detecting...
						{:else}
							Select Category
						{/if}
						<ChevronDown />
					</Button>
				</div>
			{/snippet}
			{@render trigger()}
		{/snippet}
	</Form.Control>
	<Form.Description>Choose category for this expense</Form.Description>
	<Form.FieldErrors />
</Form.Field>

<CategoryDrawer bind:open={categoryDrawerOpen} />
