<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	export const inputVariants = tv({
		base: 'selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground flex w-full min-w-0 text-base outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
		variants: {
			variant: {
				default:
					'border-input bg-background dark:bg-input/30 ring-offset-background shadow-xs rounded-md border px-3 py-1 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
				filled:
					'bg-muted dark:bg-input/30 rounded-md px-3 py-1 border-b-2 border-transparent focus-visible:border-ring focus-visible:bg-background dark:focus-visible:bg-input/50 aria-invalid:border-destructive',
				underlined:
					'bg-transparent border-b-2 border-input px-0 py-1 rounded-none focus-visible:border-ring aria-invalid:border-destructive'
			},
			inputSize: {
				default: 'h-9',
				sm: 'h-8 text-sm',
				lg: 'h-10'
			}
		},
		defaultVariants: {
			variant: 'default',
			inputSize: 'default'
		}
	});

	export type InputVariant = VariantProps<typeof inputVariants>['variant'];
	export type InputSize = VariantProps<typeof inputVariants>['inputSize'];

	export type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined }) & {
				variant?: InputVariant;
				inputSize?: InputSize;
			}
	>;
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		variant = 'default',
		inputSize = 'default',
		class: className,
		'data-slot': dataSlot = 'input',
		...restProps
	}: Props = $props();
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(inputVariants({ variant: 'default', inputSize }), 'pt-1.5 font-medium', className)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(inputVariants({ variant, inputSize }), className)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
