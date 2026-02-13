<script lang="ts">
	import { enhance } from '$app/forms';
	import { LogOut } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
</script>

<form method="POST" action="/logout" use:enhance class="w-full">
	<Button
		type="submit"
		variant="ghost"
		class="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
	>
		<LogOut class="size-4" />
		<span>Logout</span>
	</Button>
</form>
