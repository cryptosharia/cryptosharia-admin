<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let { form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);

	const isPending = $derived($page.url.searchParams.get('pending') === 'true');
</script>

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
		<label for="email" class="text-sm leading-none font-medium">Email Address</label>
		<Input
			type="email"
			id="email"
			name="email"
			required
			maxlength={255}
			placeholder="admin@cryptosharia.com"
			class="h-12"
		/>
	</div>

	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<label for="password" class="text-sm leading-none font-medium">Password</label>
			<div class="space-x-2 text-xs text-primary">
				<a href="/reset-password" class="hover:underline">Forgot password?</a>
				<span>|</span>
				<a href="/signup" class="hover:underline">Sign Up</a>
			</div>
		</div>
		<div class="relative">
			<Input
				type={showPassword ? 'text' : 'password'}
				id="password"
				name="password"
				required
				minlength={12}
				placeholder="••••••••"
				class="h-12 pr-10"
			/>
			<button
				type="button"
				class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
				onclick={() => (showPassword = !showPassword)}
			>
				{#if showPassword}
					<EyeOff size={18} />
				{:else}
					<Eye size={18} />
				{/if}
			</button>
		</div>
	</div>

	{#if form?.invalid}
		<div
			class="animate-in fade-in slide-in-from-top-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive"
		>
			Invalid email or password
		</div>
	{/if}

	{#if form?.missing}
		<div
			class="animate-in fade-in slide-in-from-top-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive"
		>
			Please fill in all fields
		</div>
	{/if}

	{#if isPending}
		<div
			class="animate-in fade-in slide-in-from-top-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-center text-sm font-medium text-amber-500"
		>
			Your account is pending approval from super admin
		</div>
	{/if}

	<Button
		type="submit"
		disabled={loading}
		class="h-12 w-full gap-2 text-base font-bold shadow-lg shadow-primary/20"
	>
		{#if loading}
			<Loader2 class="animate-spin" size={20} />
			Signing in...
		{:else}
			Sign In
			<ArrowRight size={20} />
		{/if}
	</Button>
</form>
