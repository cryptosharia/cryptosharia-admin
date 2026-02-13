<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils";

	let { class: className, children, ...props }: HTMLAttributes<HTMLHeadingElement> = $props();
</script>

<h3
	class={cn("text-2xl font-semibold leading-none tracking-tight", className)}
	{...props}
>
	{@render children?.()}
</h3>
