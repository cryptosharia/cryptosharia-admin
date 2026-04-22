<script lang="ts">
	import { enhance } from '$app/forms';
	import { Loader2, CheckCircle2, XCircle, MailCheck } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";

	let { data, form } = $props();
	let loading = $state(false);
</script>

{#if form?.success}
	<div class="text-center py-8 space-y-4 animate-in fade-in zoom-in-95 duration-300">
		<div class="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
			<CheckCircle2 size={40} />
		</div>
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">Email Verified!</h2>
			<p class="text-muted-foreground max-w-xs mx-auto">
				Your email has been verified. An admin will assign your role so you can sign in.
			</p>
		</div>
		<Button href="/login" class="mt-4 gap-2 font-bold">
			Go to Login
		</Button>
	</div>
{:else if !data.token}
	<div class="text-center py-8 space-y-4">
		<div class="inline-flex items-center justify-center h-20 w-20 rounded-full bg-destructive/10 text-destructive mb-2">
			<XCircle size={40} />
		</div>
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">Invalid Link</h2>
			<p class="text-muted-foreground max-w-xs mx-auto">
				This verification link is missing a token. Please check your email for the correct link.
			</p>
		</div>
		<Button href="/login" variant="outline">Back to Login</Button>
	</div>
{:else}
	<div class="text-center mb-6 space-y-2">
		<div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-2">
			<MailCheck size={32} />
		</div>
		<h2 class="text-xl font-bold text-foreground">Verify Your Email</h2>
		<p class="text-sm text-muted-foreground">Click the button below to confirm your email address.</p>
	</div>

	<form method="POST" use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	}}>
		<input type="hidden" name="token" value={data.token} />

		{#if form?.message}
			<div class="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
				{form.message}
			</div>
		{/if}

		<Button type="submit" disabled={loading} class="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20">
			{#if loading}
				<Loader2 class="animate-spin" size={20} />
				Verifying...
			{:else}
				<MailCheck size={20} />
				Verify Email
			{/if}
		</Button>
	</form>

	<p class="text-center text-xs text-muted-foreground mt-4">
		Already verified? <a href="/login" class="text-primary hover:underline">Sign in</a>
	</p>
{/if}
