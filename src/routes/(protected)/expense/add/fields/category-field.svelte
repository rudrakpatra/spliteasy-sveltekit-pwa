<script lang="ts">
	import { getExpenseFormContext } from '../context.svelte';
	import { Button } from '$lib/components/ui/button';
	import { categories } from '$lib/shared/category/category';
	import ChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import CategoryDrawer from '../drawers/category-drawer.svelte';
	import { useCategorySuggestion } from '$lib/hooks/use-category-suggestion';
	import { Spinner } from '$lib/components/ui/spinner';
	import { cn } from '$lib/utils';
	import { Label } from '$lib/components/ui/label';

	const ctx = getExpenseFormContext();

	let categoryDrawerOpen = $state(false);

	//auto detect category
	const autoCategory = useCategorySuggestion();
	$effect(() => {
		$autoCategory.data && ctx.categoryCode.set($autoCategory.data);
	});
</script>

<div class="space-y-2">
	<Label>Category</Label>
	{#snippet trigger()}
		{@const category = Object.values(categories).find((c) => c.code === ctx.categoryCode.current)}
		<div class={cn('w-fit')}>
			<Button
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
</div>
<CategoryDrawer bind:open={categoryDrawerOpen} />
