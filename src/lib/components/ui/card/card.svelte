<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils";

	let { class: className, children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	class={cn("rounded-xl glass-card text-card-foreground", className)}
	{...props}
>
	{@render children?.()}
</div>
