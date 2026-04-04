<script lang="ts">
	import { enhance } from '$app/forms';
	import { Loader2, ArrowRight, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";

	let { data, form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
	let showConfirm = $state(false);

	// If token in URL → reset mode, else → forgot mode
	let isResetMode = $derived(!!data.token);
</script>

<div class="mb-4">
	<Button variant="ghost" href="/login" class="text-sm gap-2 text-muted-foreground hover:text-foreground">
		<ArrowLeft size={16} />
		Back to Login
	</Button>
</div>

{#if form?.success && form?.mode === 'forgot'}
	<div class="text-center py-6 space-y-3 animate-in fade-in zoom-in-95 duration-300">
		<div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
			<CheckCircle2 size={32} />
		</div>
		<h2 class="text-xl font-bold text-foreground">Check Your Email</h2>
		<p class="text-sm text-muted-foreground max-w-xs mx-auto">
			If an account exists for that email, a reset link has been sent.
		</p>
		<Button href="/login" variant="outline" class="mt-2">Back to Login</Button>
	</div>

{:else if form?.success && form?.mode === 'reset'}
	<div class="text-center py-6 space-y-3 animate-in fade-in zoom-in-95 duration-300">
		<div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
			<CheckCircle2 size={32} />
		</div>
		<h2 class="text-xl font-bold text-foreground">Password Reset!</h2>
		<p class="text-sm text-muted-foreground">Your password has been updated. You can now sign in.</p>
		<Button href="/login" class="mt-2 gap-2 font-bold">Go to Login</Button>
	</div>

{:else if isResetMode}
	<!-- Reset mode: user came from email link with ?token=... -->
	<div class="mb-6 text-center space-y-1">
		<h2 class="text-xl font-bold text-foreground">Set New Password</h2>
		<p class="text-sm text-muted-foreground">Enter your new password below.</p>
	</div>

	<form
		method="POST"
		action="?/reset"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => { loading = false; update(); };
		}}
		class="space-y-4"
	>
		<input type="hidden" name="token" value={data.token} />

		<div class="space-y-2">
			<label for="password" class="text-sm font-medium leading-none">New Password</label>
			<div class="relative">
				<Input
					type={showPassword ? 'text' : 'password'}
					id="password"
					name="password"
					required
					minlength={12}
					placeholder="Min. 12 characters"
					class="h-12 pr-10"
				/>
				<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onclick={() => showPassword = !showPassword}>
					{#if showPassword}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
				</button>
			</div>
		</div>

		<div class="space-y-2">
			<label for="confirmPassword" class="text-sm font-medium leading-none">Confirm Password</label>
			<div class="relative">
				<Input
					type={showConfirm ? 'text' : 'password'}
					id="confirmPassword"
					name="confirmPassword"
					required
					minlength={12}
					placeholder="Repeat your password"
					class="h-12 pr-10"
				/>
				<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onclick={() => showConfirm = !showConfirm}>
					{#if showConfirm}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
				</button>
			</div>
		</div>

		{#if form?.message}
			<div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
				{form.message}
			</div>
		{/if}

		<Button type="submit" disabled={loading} class="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20">
			{#if loading}<Loader2 class="animate-spin" size={20} />Resetting...{:else}Reset Password <ArrowRight size={20} />{/if}
		</Button>
	</form>

{:else}
	<!-- Forgot mode: user enters email to receive reset link -->
	<div class="mb-6 text-center space-y-1">
		<h2 class="text-xl font-bold text-foreground">Forgot Password?</h2>
		<p class="text-sm text-muted-foreground">Enter your email to receive a reset link.</p>
	</div>

	<form
		method="POST"
		action="?/forgot"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => { loading = false; update(); };
		}}
		class="space-y-4"
	>
		<div class="space-y-2">
			<label for="email" class="text-sm font-medium leading-none">Email Address</label>
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
			<div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
				{form.message}
			</div>
		{/if}

		<Button type="submit" disabled={loading} class="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20">
			{#if loading}<Loader2 class="animate-spin" size={20} />Sending...{:else}Send Reset Link <ArrowRight size={20} />{/if}
		</Button>
	</form>
{/if}
