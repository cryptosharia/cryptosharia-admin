<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { Separator as SeparatorPrimitive } from "bits-ui";
	import { cn } from "$lib/utils";

	let {
		class: className,
		orientation = "horizontal",
		decorative = true,
		...rest
	}: HTMLAttributes<HTMLDivElement> & {
		orientation?: "horizontal" | "vertical";
		decorative?: boolean;
	} = $props();
</script>

<SeparatorPrimitive.Root
	{orientation}
	{decorative}
	class={cn(
		"shrink-0 bg-border",
		orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
		className
	)}
	{...rest}
/>
