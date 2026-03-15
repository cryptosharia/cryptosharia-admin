<script lang="ts">
	import { enhance } from '$app/forms';
	import { Loader2, ArrowRight } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="flex flex-col space-y-2 text-center mb-6">
	<h1 class="text-2xl font-semibold tracking-tight">Reset Password</h1>
	<p class="text-sm text-muted-foreground">Enter your email to receive reset instructions</p>
</div>

<form
	method="POST"
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	}}
	class="space-y-6"
>
	<div class="space-y-2">
		<label for="email" class="text-sm font-medium leading-none">Email Address</label>
		<Input
			type="email"
			id="email"
			name="email"
			required
			placeholder="admin@cryptosharia.com"
			class="h-12"
		/>
	</div>
    
    {#if form?.success}
		<div class="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
			If an account exists, a reset link has been sent.
		</div>
	{/if}

	{#if form?.error}
		<div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
			Error processing request.
		</div>
	{/if}

	<Button
		type="submit"
		disabled={loading}
		class="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20"
	>
		{#if loading}
			<Loader2 class="animate-spin" size={20} />
			Sending...
		{:else}
			Send Reset Link
			<ArrowRight size={20} />
		{/if}
	</Button>

    <div class="text-center text-sm">
        <a href="/login" class="text-primary hover:underline">Back to Login</a>
    </div>
</form>
