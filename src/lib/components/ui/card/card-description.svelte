<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils";

	let { class: className, children, ...props }: HTMLAttributes<HTMLParagraphElement> = $props();
</script>

<p
	class={cn("text-sm text-muted-foreground", className)}
	{...props}
>
	{@render children?.()}
</p>
