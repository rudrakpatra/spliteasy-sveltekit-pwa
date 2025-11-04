<script lang="ts">
	import { generateId, getExpenseFormContext } from '../context.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { useActiveElement } from '$lib/hooks/activeElement/active-element-context.svelte';
	import Calculator from '../datalists/calculator.svelte';

	const ctx = getExpenseFormContext();

	const cid = $props.id();

	// Use $derived.by for computed values that depend on reactive state
	const participantCount = $derived(ctx.participants.size);
	const filledCount = $derived(
		Array.from(ctx.participants.values()).filter((p) => p.name !== '').length
	);

	const activeElement = useActiveElement();

	const calculatorOpen = $derived.by(() => {
		const current = activeElement.current;
		// Match id={`${cid}.payer.${user.id}`} using regex
		return current?.id.match(new RegExp(`^${cid}\\.payer\\..+\\.amount$`)) !== null || false;
	});

	// Auto-add empty participant row - use immutable updates
	$effect(() => {
		if (filledCount === participantCount || participantCount === 0) {
			ctx.participants.set(generateId(), {
				name: '',
				amount: ''
			});
		}
	});
</script>

<div class="space-y-2">
	<Label>Participants (optionally add paid amounts)</Label>
	<section
		class="group grid grid-cols-[1fr_auto] items-center gap-2 rounded-md px-3 py-2 outline outline-border"
	>
		{#each ctx.participants as [id, user]}
			<label class="flex flex-1 items-center gap-2 whitespace-nowrap" for={`${cid}.payer.${id}`}>
				<Avatar.Root class="flex size-9 shrink-0 items-center">
					<Avatar.Fallback>
						{user.name.slice(0, 1).toUpperCase() || id.slice(0, 1).toUpperCase()}
					</Avatar.Fallback>
				</Avatar.Root>
				<Input
					id={`${cid}.payer.${id}.name`}
					type="text"
					placeholder={`@${id}`}
					value={ctx.participants.get(id)?.name || ''}
					oninput={(e) => {
						//convert to number
						ctx.participants.set(id, {
							...user,
							name: e.currentTarget.value
						});
					}}
					variant="underlined"
					class="field-sizing-content max-w-30 min-w-9 text-left"
					autocomplete="off"
					inputmode="text"
					data-scroll-into-view="true"
				/>
			</label>

			<Input
				id={`${cid}.payer.${id}.amount`}
				type="text"
				tabindex={-1}
				placeholder={(0).toFixed(ctx.currency.digits)}
				value={ctx.participants.get(id)?.amount || ''}
				oninput={(e) => {
					//convert to number
					ctx.participants.set(id, {
						...user,
						amount: e.currentTarget.value
					});
				}}
				variant="underlined"
				class="field-sizing-content max-w-30 min-w-9 text-center"
				autocomplete="off"
				inputmode="numeric"
				data-scroll-into-view="true"
			/>
		{/each}
	</section>
	<p class="text-xs text-muted-foreground">Optionally add paid amounts for this expense</p>
</div>

<Calculator open={calculatorOpen} id={cid} />
