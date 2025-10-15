<script>
	import { Input } from '$lib/components/ui/input';
	import * as DataList from '$lib/components/ui/data-list';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { VisualViewportView } from '$lib/components/ui/visual-viewport-view';

	let expression = $state('');
</script>

<Input id="calc-input" bind:value={expression} />

<VisualViewportView forceOverlaysContent={true}>
	<DataList.Root class="absolute inset-0 top-auto" for="calc-input">
		<DataList.Option value="+"><Plus /></DataList.Option>
		<DataList.Option value="-"><Minus /></DataList.Option>
		<DataList.Option value="*"><X /></DataList.Option>
	</DataList.Root>
</VisualViewportView>
