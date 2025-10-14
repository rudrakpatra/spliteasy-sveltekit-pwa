<script lang="ts">
	import { cn } from 'tailwind-variants';

	let { class: className = 'h-4 w-4', ...props }: { class?: string; [key: string]: any } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width="24"
	height="24"
	viewBox="6 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={cn('icon icon-tabler icons-tabler-outline icon-tabler-parentheses', className)}
	{...props}
>
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<!-- <path d="M7 4a12.25 12.25 0 0 0 0 16" /> -->
	<path d="M17 4a12.25 12.25 0 0 1 0 16" />
</svg>
