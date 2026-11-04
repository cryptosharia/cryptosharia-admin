<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		ArrowLeft,
		UserPlus,
		User,
		Mail,
		Lock,
		Eye,
		EyeOff,
		Shield,
		KeyRound,
		AlertCircle
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';

	let { data, form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
	let password = $state('');

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' },
		{ value: 'suspended', label: 'Suspended' },
		{ value: 'banned', label: 'Banned' }
	];

	function generatePassword() {
		const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
		let result = '';
		const cryptoObj = window.crypto || (window as any).msCrypto;
		const values = new Uint32Array(16);
		cryptoObj.getRandomValues(values);
		for (let i = 0; i < 16; i++) {
			result += chars[values[i] % chars.length];
		}
		password = result;
		showPassword = true;
	}
</script>

<div class="mx-auto max-w-4xl space-y-6">
	<div class="flex items-center gap-4">
		<Button href="/users" variant="outline" size="icon" class="rounded-full">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Tambah Pengguna Baru</h1>
			<p class="text-muted-foreground">Buat akun pengguna baru dengan email dan password.</p>
		</div>
	</div>

	{#if form?.message && !form?.success}
		<div
			class="animate-in fade-in slide-in-from-top-2 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive"
		>
			<AlertCircle class="mt-0.5 shrink-0" size={18} />
			<div class="flex-1">{form.message}</div>
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				await update();
			};
		}}
		class="space-y-8"
	>
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Main Form Fields -->
			<div class="space-y-6 lg:col-span-2">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<User size={18} class="text-primary" />
							Informasi Akun
						</CardTitle>
						<CardDescription>Masukkan nama lengkap, alamat email, dan kata sandi akun.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-5">
						<!-- Name -->
						<div class="space-y-2">
							<label for="name" class="flex items-center gap-2 text-sm leading-none font-medium">
								<User size={14} class="text-muted-foreground" />
								Nama Lengkap
							</label>
							<Input
								type="text"
								id="name"
								name="name"
								value={form?.values?.name ?? ''}
								required
								minlength={2}
								maxlength={120}
								placeholder="cth. Ahmad Fauzi"
								class="h-11"
							/>
						</div>

						<!-- Email -->
						<div class="space-y-2">
							<label for="email" class="flex items-center gap-2 text-sm leading-none font-medium">
								<Mail size={14} class="text-muted-foreground" />
								Alamat Email
							</label>
							<Input
								type="email"
								id="email"
								name="email"
								value={form?.values?.email ?? ''}
								required
								placeholder="cth. ahmad@cryptosharia.id"
								class="h-11"
							/>
							<p class="text-xs text-muted-foreground">Email ini akan digunakan pengguna untuk login ke sistem.</p>
						</div>

						<!-- Password -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="password" class="flex items-center gap-2 text-sm leading-none font-medium">
									<Lock size={14} class="text-muted-foreground" />
									Password
								</label>
								<button
									type="button"
									onclick={generatePassword}
									class="flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
								>
									<KeyRound size={12} />
									Generate Password
								</button>
							</div>
							<div class="relative">
								<Input
									type={showPassword ? 'text' : 'password'}
									id="password"
									name="password"
									bind:value={password}
									required
									minlength={12}
									maxlength={128}
									placeholder="Minimal 12 karakter"
									class="h-11 pr-10 font-mono text-sm"
								/>
								<button
									type="button"
									onclick={() => (showPassword = !showPassword)}
									class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{#if showPassword}
										<EyeOff size={16} />
									{:else}
										<Eye size={16} />
									{/if}
								</button>
							</div>
							<p class="text-xs text-muted-foreground">
								Minimal 12 karakter. Disarankan perpaduan huruf besar, huruf kecil, angka, dan simbol.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Role & Status Sidebar -->
			<div class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-primary">
							<Shield size={18} />
							Hak Akses & Status
						</CardTitle>
						<CardDescription>Tentukan peran dan status akun pengguna ini.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-5">
						<!-- Role selection -->
						<div class="space-y-2">
							<label
								for="role"
								class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
							>
								Role Pengguna
							</label>
							<select
								id="role"
								name="role"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
							>
								{#each data.roles as opt}
									<option value={opt.value} selected={form?.values?.role === opt.value || (!form?.values?.role && opt.value === 'member')}>
										{opt.label}
									</option>
								{/each}
							</select>
							<p class="text-xs text-muted-foreground">
								Pilih peran yang sesuai dengan tanggung jawab pengguna.
							</p>
						</div>

						<!-- Status selection -->
						<div class="space-y-2">
							<label
								for="status"
								class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
							>
								Status Akun
							</label>
							<select
								id="status"
								name="status"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
							>
								{#each statusOptions as opt}
									<option value={opt.value} selected={form?.values?.status === opt.value || (!form?.values?.status && opt.value === 'active')}>
										{opt.label}
									</option>
								{/each}
							</select>
							<p class="text-xs text-muted-foreground">Hanya status "Active" yang dapat login ke sistem.</p>
						</div>

						<Separator />

						<div class="space-y-2 pt-1">
							<Button type="submit" disabled={loading} class="h-11 w-full gap-2 font-bold">
								{#if loading}
									<div
										class="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"
									></div>
									Menyimpan...
								{:else}
									<UserPlus size={18} />
									Tambah Pengguna
								{/if}
							</Button>
							<Button href="/users" variant="outline" class="w-full">
								Batal
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>
