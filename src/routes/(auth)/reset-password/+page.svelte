<script lang="ts">
	import { enhance } from '$app/forms';
	import { Loader2, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="mb-4">
	<Button
		variant="ghost"
		href="/login"
		class="gap-2 text-sm text-muted-foreground hover:text-foreground"
	>
		<ArrowLeft size={16} />
		Back to Login
	</Button>
</div>

{#if form?.success}
	<div class="animate-in fade-in zoom-in-95 space-y-3 py-6 text-center duration-300">
		<div
			class="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"
		>
			<CheckCircle2 size={32} />
		</div>
		<h2 class="text-xl font-bold text-foreground">Check Your Email</h2>
		<p class="mx-auto max-w-xs text-sm text-muted-foreground">
			If an account exists for that email, a reset link has been sent.
		</p>
		<Button href="/login" variant="outline" class="mt-2">Back to Login</Button>
	</div>
{:else}
	<div class="mb-6 space-y-1 text-center">
		<h2 class="text-xl font-bold text-foreground">Forgot Password?</h2>
		<p class="text-sm text-muted-foreground">Enter your email to receive a reset link.</p>
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
		class="space-y-4"
	>
		<div class="space-y-2">
			<label for="email" class="text-sm leading-none font-medium">Email Address</label>
			<Input
				type="email"
				id="email"
				name="email"
				required
				maxlength={255}
				placeholder="your@email.com"
				class="h-12"
			/>
		</div>

		{#if form?.message}
			<div
				class="animate-in fade-in slide-in-from-top-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive"
			>
				{form.message}
			</div>
		{/if}

		<Button
			type="submit"
			disabled={loading}
			class="h-12 w-full gap-2 text-base font-bold shadow-lg shadow-primary/20"
		>
			{#if loading}<Loader2 class="animate-spin" size={20} />Sending...{:else}Send Reset Link <ArrowRight
					size={20}
				/>{/if}
		</Button>
	</form>
{/if}
