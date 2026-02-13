<script lang="ts">
	import { enhance } from '$app/forms';
	import { Shield, ArrowLeft } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";

	let { form } = $props();
</script>

<div class="space-y-6">
	<div class="text-center space-y-2">
		<h2 class="text-xl font-bold">Two-Factor Auth</h2>
		<p class="text-sm text-muted-foreground">Enter the verification code from your app.</p>
	</div>

	<form method="POST" use:enhance class="space-y-6">
		<div class="space-y-4">
			<label for="token" class="text-sm font-medium leading-none text-center block">Verification Code</label>
			<Input
				type="text"
				id="token"
				name="token"
				required
				placeholder="000000"
				maxlength={6}
				autocomplete="one-time-code"
				class="h-16 text-center text-3xl tracking-[0.5em] font-mono"
			/>
		</div>

		<Button type="submit" class="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20">
			Verify & Login
		</Button>

		{#if form?.invalid}
			<p class="text-center text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
				Invalid verification code. Please try again.
			</p>
		{/if}
	</form>

	<div class="pt-4 border-t text-center">
		<Button variant="ghost" href="/login" class="text-sm gap-2 text-muted-foreground hover:text-foreground">
			<ArrowLeft size={16} />
			Back to Login
		</Button>
	</div>
</div>

