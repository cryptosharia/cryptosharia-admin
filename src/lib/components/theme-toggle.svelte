<script lang="ts">
	import { Sun, Moon } from "lucide-svelte";
	import { toggleMode } from "mode-watcher";
	import { Button } from "$lib/components/ui/button";
	import { onMount } from "svelte";

	// Handle initial hydration mismatch
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
</script>

<Button variant="ghost" size="icon" onclick={toggleMode}>
	<Sun class="h-[1.2rem] w-[1.2rem] transition-all dark:hidden" />
	<Moon class="h-[1.2rem] w-[1.2rem] transition-all hidden dark:block" />
	<span class="sr-only">Toggle theme</span>
</Button>
