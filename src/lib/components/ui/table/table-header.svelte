<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils";

	let { class: className, children, ...props }: HTMLAttributes<HTMLTableSectionElement> = $props();
</script>

<thead class={cn("[&_tr]:border-b", className)} {...props}>
	{@render children?.()}
</thead>
