<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Loader2, ArrowRight } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let { form } = $props();
	let loading = $state(false);

	const isPending = $derived($page.url.searchParams.get('pending') === 'true');

	function normalizeOtp(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		input.value = input.value.replace(/[^0-9]/g, '').slice(0, 6);
	}
</script>

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
			value={form?.email ?? ''}
		/>
	</div>

	{#if form?.error}
		<div
			class="animate-in fade-in slide-in-from-top-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive"
		>
			{form.error}
		</div>
	{/if}

	{#if form?.message}
		<div
			class="animate-in fade-in slide-in-from-top-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-600"
		>
			{form.message}
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
			Mengirim OTP...
		{:else}
			Kirim kode OTP
			<ArrowRight size={20} />
		{/if}
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
		class="mt-6 space-y-6"
	>
		<input type="hidden" name="email" value={form.email} />
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
			<p class="text-xs text-muted-foreground">Masukkan enam digit yang dikirim ke email.</p>
		</div>
		<Button type="submit" disabled={loading} class="h-12 w-full gap-2 text-base font-bold">
			{#if loading}<Loader2 class="animate-spin" size={20} />{/if}
			Verifikasi dan masuk
		</Button>
	</form>
{/if}
