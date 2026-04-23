<script lang="ts">
	import { enhance } from '$app/forms';
	import { Loader2, ArrowRight, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let { form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
	let showConfirm = $state(false);
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
		<h2 class="text-xl font-bold text-foreground">Password Reset!</h2>
		<p class="text-sm text-muted-foreground">
			Your password has been updated. You can now sign in.
		</p>
		<Button href="/login" class="mt-2 gap-2 font-bold">Go to Login</Button>
	</div>
{:else}
	<div class="mb-6 space-y-1 text-center">
		<h2 class="text-xl font-bold text-foreground">Set New Password</h2>
		<p class="text-sm text-muted-foreground">Enter your new password below.</p>
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
			<label for="password" class="text-sm leading-none font-medium">New Password</label>
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
					class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
					onclick={() => (showPassword = !showPassword)}
				>
					{#if showPassword}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
				</button>
			</div>
		</div>

		<div class="space-y-2">
			<label for="confirmPassword" class="text-sm leading-none font-medium">Confirm Password</label>
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
					class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
					onclick={() => (showConfirm = !showConfirm)}
				>
					{#if showConfirm}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
				</button>
			</div>
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
			{#if loading}<Loader2 class="animate-spin" size={20} />Resetting...{:else}Reset Password <ArrowRight
					size={20}
				/>{/if}
		</Button>
	</form>
{/if}
