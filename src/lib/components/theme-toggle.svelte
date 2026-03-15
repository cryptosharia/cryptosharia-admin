<script lang="ts">
	import { Sun, Moon } from "lucide-svelte";
	import { toggleMode, mode } from "mode-watcher";
	import { Button } from "$lib/components/ui/button";
</script>

<Button 
	variant="ghost" 
	size="icon" 
	onclick={toggleMode}
	title={mode.current === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
	class="rounded-full"
>
	{#if mode.current === 'dark'}
		<Sun class="h-[1.2rem] w-[1.2rem] text-amber-400" />
	{:else}
		<Moon class="h-[1.2rem] w-[1.2rem] text-slate-600" />
	{/if}
	<span class="sr-only">Toggle theme</span>
</Button>
