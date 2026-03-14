<script lang="ts">
	import { enhance } from '$app/forms';
	import { LogOut, Loader2 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";

	let isLoggingOut = $state(false);
</script>

<form 
	method="POST" 
	action="/logout" 
	use:enhance={() => {
		isLoggingOut = true;
		return async ({ update }) => {
			await update();
			isLoggingOut = false;
		};
	}}
	class="w-full"
>
	<Button
		type="submit"
		variant="ghost"
		disabled={isLoggingOut}
		class="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group disabled:opacity-70 disabled:cursor-not-allowed"
	>
		{#if isLoggingOut}
			<Loader2 class="size-4 animate-spin" />
			<span>Logging out...</span>
		{:else}
			<LogOut class="size-4 group-hover:translate-x-0.5 transition-transform" />
			<span>Logout</span>
		{/if}
	</Button>
</form>
