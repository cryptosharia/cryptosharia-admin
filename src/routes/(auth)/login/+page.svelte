<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let { form } = $props();
	let loading = $state(false);
	let method = $state<'password' | 'otp'>('password');
	let showPassword = $state(false);

	const isPending = $derived($page.url.searchParams.get('pending') === 'true');

	$effect(() => {
		if (form?.otpRequested) method = 'otp';
	});

	function normalizeOtp(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		input.value = input.value.replace(/[^0-9]/g, '').slice(0, 6);
	}
</script>

<svelte:head>
	<title>Masuk | CryptoSharia Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
	<div class="space-y-2 text-center">
		<h2 class="text-xl font-bold text-foreground">Masuk ke CryptoSharia Admin</h2>
		<p class="text-sm text-muted-foreground">Gunakan email dan kata sandi akun admin Anda.</p>
	</div>

	<div class="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-1" aria-label="Metode masuk">
		<button
			type="button"
			aria-pressed={method === 'password'}
			class={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${method === 'password' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
			onclick={() => (method = 'password')}
		>
			Email + kata sandi
		</button>
		<button
			type="button"
			aria-pressed={method === 'otp'}
			class={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${method === 'otp' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
			onclick={() => (method = 'otp')}
		>
			Kode email
		</button>
	</div>

	{#if form?.error}
		<div
			role="alert"
			class="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive"
		>
			{form.error}
		</div>
	{/if}
	{#if form?.message}
		<div
			role="status"
			class="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-600"
		>
			{form.message}
		</div>
	{/if}
	{#if isPending}
		<div
			class="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-center text-sm text-amber-600"
		>
			Akun Anda menunggu persetujuan super admin.
		</div>
	{/if}

	{#if method === 'password'}
		<form
			method="POST"
			action="?/loginWithPassword"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					update();
				};
			}}
			class="space-y-5"
		>
			<div class="space-y-2">
				<label for="password-email" class="text-sm leading-none font-medium">Email</label>
				<Input
					type="email"
					id="password-email"
					name="email"
					required
					maxlength={255}
					autocomplete="username"
					placeholder="nama@email.com"
					class="h-12"
					value={form?.email ?? ''}
				/>
				<input
					type="hidden"
					name="redirect"
					value={form?.redirect ?? $page.url.searchParams.get('redirect') ?? ''}
				/>
			</div>
			<div class="space-y-2">
				<label for="password" class="text-sm leading-none font-medium">Kata sandi</label>
				<div class="relative">
					<Input
						type={showPassword ? 'text' : 'password'}
						id="password"
						name="password"
						required
						maxlength={128}
						autocomplete="current-password"
						placeholder="Kata sandi"
						class="h-12 pr-12"
					/>
					<button
						type="button"
						class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
					</button>
				</div>
				<div class="text-right">
					<a
						href={resolve('/reset-password')}
						class="text-sm text-primary underline-offset-4 hover:underline"
					>
						Lupa kata sandi?
					</a>
				</div>
			</div>
			<Button type="submit" disabled={loading} class="h-12 w-full gap-2 text-base font-bold">
				{#if loading}<Loader2 class="animate-spin" size={20} />Memproses...{:else}Masuk <ArrowRight
						size={20}
					/>{/if}
			</Button>
		</form>
	{:else}
		<form
			method="POST"
			action="?/requestOtp"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					update();
				};
			}}
			class="space-y-5"
		>
			<div class="space-y-2">
				<label for="otp-email" class="text-sm leading-none font-medium">Email</label>
				<Input
					type="email"
					id="otp-email"
					name="email"
					required
					maxlength={255}
					autocomplete="email"
					placeholder="nama@email.com"
					class="h-12"
					value={form?.email ?? ''}
				/>
				<input
					type="hidden"
					name="redirect"
					value={form?.redirect ?? $page.url.searchParams.get('redirect') ?? ''}
				/>
			</div>
			<Button type="submit" disabled={loading} class="h-12 w-full gap-2 text-base font-bold">
				{#if loading}<Loader2 class="animate-spin" size={20} />Mengirim kode...{:else}Kirim kode OTP <ArrowRight
						size={20}
					/>{/if}
			</Button>
		</form>

		{#if form?.otpRequested}
			<form
				method="POST"
				action="?/verifyOtp"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						update();
					};
				}}
				class="space-y-5 border-t border-border pt-5"
			>
				<input type="hidden" name="email" value={form.email} />
				<input
					type="hidden"
					name="redirect"
					value={form?.redirect ?? $page.url.searchParams.get('redirect') ?? ''}
				/>
				<div class="space-y-2">
					<label for="code" class="text-sm leading-none font-medium">Kode OTP</label>
					<Input
						type="text"
						inputmode="numeric"
						id="code"
						name="code"
						autocomplete="one-time-code"
						required
						minlength={6}
						maxlength={6}
						placeholder="000000"
						class="h-12 tracking-[0.35em]"
						oninput={normalizeOtp}
					/>
					<p class="text-xs text-muted-foreground">
						Masukkan enam digit yang dikirim ke email Anda.
					</p>
				</div>
				<Button type="submit" disabled={loading} class="h-12 w-full gap-2 text-base font-bold">
					{#if loading}<Loader2 class="animate-spin" size={20} />{/if}
					Verifikasi dan masuk
				</Button>
			</form>
		{/if}
	{/if}
</div>
