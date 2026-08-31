<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let {
		class: className,
		orientation = 'horizontal',
		decorative = true,
		...rest
	}: HTMLAttributes<HTMLDivElement> & {
		orientation?: 'horizontal' | 'vertical';
		decorative?: boolean;
	} = $props();
</script>

<div
	role={decorative ? undefined : 'separator'}
	aria-orientation={decorative ? undefined : orientation}
	aria-hidden={decorative ? 'true' : undefined}
	class={cn(
		'shrink-0 bg-border',
		orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
		className
	)}
	{...rest}
></div>
