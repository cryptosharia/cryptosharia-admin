<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils";

	let { class: className, children, ...props }: HTMLAttributes<HTMLTableCaptionElement> = $props();
</script>

<caption
	class={cn("mt-4 text-sm text-muted-foreground", className)}
	{...props}
>
	{@render children?.()}
</caption>
