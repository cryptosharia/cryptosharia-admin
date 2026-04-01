<script lang="ts">
	import { enhance } from '$app/forms';
	import { Loader2, ArrowRight, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";

	let { form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
	let showConfirm = $state(false);
</script>

<div class="mb-6">
	<Button variant="ghost" href="/login" class="text-sm gap-2 text-muted-foreground hover:text-foreground">
		<ArrowLeft size={16} />
		Back to Login
	</Button>
</div>

{#if form?.success}
	<div class="text-center py-8 space-y-4 animate-in fade-in zoom-in-95 duration-300">
		<div class="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
			<CheckCircle2 size={40} />
		</div>
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">Check Your Email</h2>
			<p class="text-muted-foreground max-w-xs mx-auto">
				We've sent a verification link to your email. Please verify your account before signing in.
			</p>
			<p class="text-xs text-muted-foreground">
				After verification, an admin will assign your role so you can access the platform.
			</p>
		</div>
		<Button href="/login" variant="outline" class="mt-4">
			Go to Login
		</Button>
	</div>
{:else}
	<div class="mb-6">
		<h2 class="text-xl font-bold text-foreground">Create an Account</h2>
		<p class="text-sm text-muted-foreground mt-1">Register and wait for admin approval to get started.</p>
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
			<label for="name" class="text-sm font-medium leading-none">Full Name</label>
			<Input
				type="text"
				id="name"
				name="name"
				required
				minlength={2}
				maxlength={120}
				placeholder="John Doe"
				class="h-12"
			/>
		</div>

		<div class="space-y-2">
			<label for="email" class="text-sm font-medium leading-none">Email Address</label>
			<Input
				type="email"
				id="email"
				name="email"
				required
				maxlength={255}
				placeholder="john@example.com"
				class="h-12"
			/>
		</div>

		<div class="space-y-2">
			<label for="password" class="text-sm font-medium leading-none">Password</label>
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
				<button
					type="button"
					class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					onclick={() => showPassword = !showPassword}
				>
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
				<button
					type="button"
					class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					onclick={() => showConfirm = !showConfirm}
				>
					{#if showConfirm}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
				</button>
			</div>
		</div>

		{#if form?.message}
			<div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
				{form.message}
			</div>
		{/if}

		<Button
			type="submit"
			disabled={loading}
			class="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20"
		>
			{#if loading}
				<Loader2 class="animate-spin" size={20} />
				Creating account...
			{:else}
				Create Account
				<ArrowRight size={20} />
			{/if}
		</Button>
	</form>
{/if}
