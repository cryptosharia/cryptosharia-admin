<script lang="ts">
	import { Sun, Moon } from "lucide-svelte";
	import { toggleMode, mode } from "mode-watcher";
	import { Button } from "$lib/components/ui/button";
	import { onMount } from "svelte";

	// Handle initial hydration mismatch
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
</script>

<Button variant="ghost" size="icon" onclick={toggleMode}>
	{#if !mounted}
		<div class="h-[1.2rem] w-[1.2rem]"></div>
	{:else if $mode === 'dark'}
		<Moon class="h-[1.2rem] w-[1.2rem]" />
		<span class="sr-only">Dark Mode</span>
	{:else}
		<Sun class="h-[1.2rem] w-[1.2rem]" />
		<span class="sr-only">Light Mode</span>
	{/if}
</Button>
