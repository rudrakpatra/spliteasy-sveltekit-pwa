<script lang="ts">
	import { ExpenseInput } from '$lib/expense-prism';
	import type { ExpenseData, ParticipantContext } from '$lib/expense-prism';

	const context: ParticipantContext = {
		members: ['Alice', 'Bob', 'Charlie', 'David']
	};

	let expenseText = $state('');

	function handleParse(data: ExpenseData) {
		console.log('Parsed expense:', data);
		// You could submit this to your backend here
		// alert(`Parsed: ${JSON.stringify(data, null, 2)}`);
	}
</script>

<svelte:head>
	<title>Expense Prism Demo</title>
</svelte:head>

<div class="container mx-auto max-w-2xl p-8">
	<h1 class="mb-6 text-3xl font-bold">Expense Prism Demo</h1>

	<div class="bg-muted/50 mb-8 rounded-lg border p-4">
		<h2 class="mb-2 text-xl font-semibold">Try these examples:</h2>
		<ul class="space-y-1 text-sm">
			<li><code>Alice paid 100 for Pizza</code></li>
			<li><code>Bob paid 50 + 10% for Burger Split evenly among Alice and Charlie</code></li>
			<li><code>Add 25 for Drinks Split evenly among Alice Bob Charlie</code></li>
			<li><code>Charlie paid 75.50 + 15% for Movie tickets</code></li>
		</ul>
	</div>

	<div class="space-y-4 border">
		<ExpenseInput
			{context}
			bind:value={expenseText}
			onParse={handleParse}
			placeholder="Alice paid 100 for Burger..."
			class="w-full"
		/>
	</div>

	{#if expenseText}
		<div class="mt-6 rounded-lg border p-4">
			<h3 class="mb-2 font-semibold">Current Input:</h3>
			<p class="bg-muted rounded p-2 font-mono text-sm">{expenseText}</p>
		</div>
	{/if}
</div>
