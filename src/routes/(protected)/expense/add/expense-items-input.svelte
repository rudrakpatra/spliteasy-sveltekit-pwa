<script lang="ts">
	import Plus from '@tabler/icons-svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import X from '@lucide/svelte/icons/x';
	import Divide from '@lucide/svelte/icons/divide';
	import Percent from '@lucide/svelte/icons/percent';
	import VisualViewportView from '$lib/components/ui/visual-viewport-view/visual-viewport-view.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import ArrowRight from '@tabler/icons-svelte/icons/arrow-right';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import * as DataList from '$lib/components/ui/data-list';
	import BracketOpen from '$lib/components/icons/bracket-open.svelte';
	import BracketClose from '$lib/components/icons/bracket-close.svelte';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Select from '$lib/components/ui/select';
	import ChartPie from '@tabler/icons-svelte/icons/chart-pie';
	import ChartPieFilled from '@tabler/icons-svelte/icons/chart-pie-filled';
	import { Label } from '$lib/components/ui/label';
	import Square from '@tabler/icons-svelte/icons/square';
	import SquareCheck from '@tabler/icons-svelte/icons/square-check';
	import SquareCheckFilled from '@tabler/icons-svelte/icons/square-check-filled';
	import TrashFilled from '@tabler/icons-svelte/icons/trash-filled';
	import Trash from '@tabler/icons-svelte/icons/trash';
	import { VIBRATE_DURATION } from '$lib/constants';
	import { Button } from '$lib/components/ui/button';
	import Dots from '@tabler/icons-svelte/icons/dots';

	let participants = $state(['rudrak', 'roopak', 'raunaque', 'alice', 'bob', 'charlie']);

	let tags = {
		start: [
			{
				label: 'Add',
				command: (inputEl: HTMLDivElement) => {
					inputEl.focus();
				}
			}
		]
	};
</script>

<div id="expense-items-input" contenteditable="true">Alice paid</div>

<VisualViewportView forceOverlaysContent>
	<DataList.Root
		for="expense-items-input"
		class="absolute inset-0 top-auto flex h-12 items-start gap-3 overflow-auto border-t border-border bg-background px-3 py-1 text-foreground"
	>
		<DataList.Option value="+">
			<Badge class="rounded-full p-2 px-3">
				<Plus />
			</Badge>
		</DataList.Option>
		<DataList.Option value="-">
			<Badge class="rounded-full p-2 px-3">
				<Minus />
			</Badge>
		</DataList.Option>
		<DataList.Option value="*">
			<Badge class="rounded-full p-2 px-3">
				<X />
			</Badge>
		</DataList.Option>
		<DataList.Option value="/">
			<Badge class="rounded-full p-2 px-3">
				<Divide />
			</Badge>
		</DataList.Option>
		<DataList.Option value="%">
			<Badge class="rounded-full p-2 px-3">
				<Percent />
			</Badge>
		</DataList.Option>
		<DataList.Option value="(">
			<Badge class="rounded-full p-2 px-3">
				<BracketOpen />
			</Badge>
		</DataList.Option>
		<DataList.Option value=")">
			<Badge class="rounded-full p-2 px-3">
				<BracketClose />
			</Badge>
		</DataList.Option>
	</DataList.Root>
</VisualViewportView>

<style>
	/* input::-webkit-calendar-picker-indicator {
		display: none !important;
	} */
	input {
		field-sizing: content;
	}
	input:focus {
		outline: none;
	}
</style>
