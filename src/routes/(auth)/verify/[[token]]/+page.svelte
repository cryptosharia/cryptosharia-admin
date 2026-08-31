<script lang="ts">
	import { enhance } from '$app/forms';
	import { Loader2, CheckCircle2, XCircle, MailCheck } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	let { data, form }: { data: any; form: any } = $props();
	let loading = $state(false);
</script>

{#if form?.success}
	<div class="animate-in fade-in zoom-in-95 space-y-4 py-8 text-center duration-300">
		<div
			class="mb-2 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"
		>
			<CheckCircle2 size={40} />
		</div>
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">Email Verified!</h2>
			<p class="mx-auto max-w-xs text-muted-foreground">
				Your email has been verified. An admin will assign your role so you can sign in.
			</p>
		</div>
		<Button href="/login" class="mt-4 gap-2 font-bold">Go to Login</Button>
	</div>
{:else if !data.token}
	<div class="space-y-4 py-8 text-center">
		<div
			class="mb-2 inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive"
		>
			<XCircle size={40} />
		</div>
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">Invalid Link</h2>
			<p class="mx-auto max-w-xs text-muted-foreground">
				This verification link is missing a token. Please check your email for the correct link.
			</p>
		</div>
		<Button href="/login" variant="outline">Back to Login</Button>
	</div>
{:else}
	<div class="mb-6 space-y-2 text-center">
		<div
			class="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
		>
			<MailCheck size={32} />
		</div>
		<h2 class="text-xl font-bold text-foreground">Verify Your Email</h2>
		<p class="text-sm text-muted-foreground">
			Click the button below to confirm your email address.
		</p>
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
	>
		<input type="hidden" name="token" value={data.token} />

		{#if form?.message}
			<div
				class="animate-in fade-in slide-in-from-top-2 mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive"
			>
				{form.message}
			</div>
		{/if}

		<Button
			type="submit"
			disabled={loading}
			class="h-12 w-full gap-2 text-base font-bold shadow-lg shadow-primary/20"
		>
			{#if loading}
				<Loader2 class="animate-spin" size={20} />
				Verifying...
			{:else}
				<MailCheck size={20} />
				Verify Email
			{/if}
		</Button>
	</form>

	<p class="mt-4 text-center text-xs text-muted-foreground">
		Already verified? <a href="/login" class="text-primary hover:underline">Sign in</a>
	</p>
{/if}
