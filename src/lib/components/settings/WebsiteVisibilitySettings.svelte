<script lang="ts">
	import { CheckCircle2, Eye, LoaderCircle, RotateCcw, Save } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import type { AcademyVisibilitySettings } from '$lib/server/websiteSettings';
	import { untrack } from 'svelte';

	let {
		settings,
		settingsError
	}: {
		settings: AcademyVisibilitySettings | null;
		settingsError: string | null;
	} = $props();

	type Draft = Pick<
		AcademyVisibilitySettings,
		'academyPromotionEnabled' | 'academyNavbarEnabled' | 'academyHomepageSectionEnabled'
	>;
	const toDraft = (value: AcademyVisibilitySettings): Draft => ({
		academyPromotionEnabled: value.academyPromotionEnabled,
		academyNavbarEnabled: value.academyNavbarEnabled,
		academyHomepageSectionEnabled: value.academyHomepageSectionEnabled
	});

	let saved = $state<AcademyVisibilitySettings | null>(
		untrack(() => (settings ? { ...settings } : null))
	);
	let draft = $state<Draft | null>(untrack(() => (settings ? toDraft(settings) : null)));
	let saving = $state(false);
	let errorMessage = $state(untrack(() => settingsError ?? ''));
	let successMessage = $state('');
	let dirty = $derived(
		Boolean(saved && draft && JSON.stringify(toDraft(saved)) !== JSON.stringify(draft))
	);
	let effectiveNavbar = $derived(
		Boolean(draft?.academyPromotionEnabled && draft.academyNavbarEnabled)
	);
	let effectiveSection = $derived(
		Boolean(draft?.academyPromotionEnabled && draft.academyHomepageSectionEnabled)
	);

	function resetDraft() {
		if (!saved) return;
		draft = toDraft(saved);
		errorMessage = '';
		successMessage = '';
	}

	async function saveSettings(event: SubmitEvent) {
		event.preventDefault();
		if (!draft || !saved || !dirty || saving) return;

		saving = true;
		errorMessage = '';
		successMessage = '';
		try {
			const response = await fetch('/api/settings/academy', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ...draft, expectedVersion: saved.version })
			});
			const result = (await response.json()) as AcademyVisibilitySettings & { message?: string };
			if (!response.ok) {
				throw new Error(result.message || 'Perubahan belum tersimpan. Coba lagi.');
			}

			saved = result;
			draft = toDraft(result);
			successMessage = 'Perubahan berhasil disimpan dan dikonfirmasi oleh server.';
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Terjadi kendala saat menyimpan perubahan.';
		} finally {
			saving = false;
		}
	}

	function formatUpdatedAt(value: string) {
		return `${value.replace('T', ' ').slice(0, 16)} UTC`;
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-semibold tracking-tight text-foreground">
			Pengaturan Tampilan Website
		</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Kelola visibilitas elemen website CryptoSharia tanpa mengubah source code.
		</p>
	</div>

	{#if settingsError && !settings}
		<Card>
			<CardContent class="space-y-4 py-8">
				<p class="text-sm text-destructive" role="alert">
					Pengaturan belum dapat dimuat: {settingsError}
				</p>
				<Button type="button" variant="outline" onclick={() => window.location.reload()}>
					Muat Ulang Konfigurasi
				</Button>
			</CardContent>
		</Card>
	{:else if draft && saved}
		<Card>
			<CardHeader>
				<div class="flex items-start gap-3">
					<div
						class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<Eye size={20} aria-hidden="true" />
					</div>
					<div>
						<CardTitle>CryptoSharia Academy</CardTitle>
						<CardDescription class="mt-1">
							Atur apakah promosi Academy ditampilkan pada navigasi dan halaman utama CryptoSharia.
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<form class="space-y-5" onsubmit={saveSettings}>
					<fieldset disabled={saving} class="space-y-3">
						<legend class="sr-only">Visibilitas promosi Academy</legend>
						<label
							for="academy-master"
							class="flex cursor-pointer items-start justify-between gap-5 rounded-xl border p-4"
						>
							<span class="space-y-1">
								<span class="block font-medium">Tampilkan Promosi Academy</span>
								<span id="academy-master-description" class="block text-sm text-muted-foreground">
									Aktifkan atau nonaktifkan visibilitas promosi CryptoSharia Academy pada website
									utama.
								</span>
								<span class="mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium">
									{draft.academyPromotionEnabled ? 'Aktif' : 'Nonaktif'}
								</span>
							</span>
							<input
								id="academy-master"
								class="mt-1 size-5 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
								type="checkbox"
								role="switch"
								aria-describedby="academy-master-description"
								bind:checked={draft.academyPromotionEnabled}
							/>
						</label>

						<div class="space-y-3 rounded-xl bg-muted/40 p-4">
							<p class="text-sm font-medium">Lokasi promosi</p>
							<label
								for="academy-navbar"
								class="flex cursor-pointer items-start justify-between gap-5 rounded-lg border bg-background p-4"
							>
								<span class="space-y-1">
									<span class="block font-medium">Menu Academy di Navbar</span>
									<span id="academy-navbar-description" class="block text-sm text-muted-foreground">
										Tampilkan tautan Academy pada navigasi utama website.
									</span>
									<span
										class="mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium"
									>
										{effectiveNavbar ? 'Akan tampil' : 'Akan disembunyikan'}
									</span>
								</span>
								<input
									id="academy-navbar"
									class="mt-1 size-5 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed"
									type="checkbox"
									role="switch"
									aria-describedby="academy-navbar-description"
									bind:checked={draft.academyNavbarEnabled}
									disabled={!draft.academyPromotionEnabled}
								/>
							</label>
							<label
								for="academy-section"
								class="flex cursor-pointer items-start justify-between gap-5 rounded-lg border bg-background p-4"
							>
								<span class="space-y-1">
									<span class="block font-medium">Section Academy di Homepage</span>
									<span
										id="academy-section-description"
										class="block text-sm text-muted-foreground"
									>
										Tampilkan atau sembunyikan spotlight CryptoSharia Academy pada halaman utama.
									</span>
									<span
										class="mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium"
									>
										{effectiveSection ? 'Akan tampil' : 'Akan disembunyikan'}
									</span>
								</span>
								<input
									id="academy-section"
									class="mt-1 size-5 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed"
									type="checkbox"
									role="switch"
									aria-describedby="academy-section-description"
									bind:checked={draft.academyHomepageSectionEnabled}
									disabled={!draft.academyPromotionEnabled}
								/>
							</label>
							{#if !draft.academyPromotionEnabled}
								<p class="px-1 text-sm text-muted-foreground" role="status">
									Master nonaktif. Pilihan lokasi tetap tersimpan dan akan berlaku kembali saat
									master diaktifkan.
								</p>
							{/if}
						</div>
					</fieldset>

					<div
						class="rounded-xl border bg-muted/20 p-4"
						aria-label="Pratinjau lokal berdasarkan perubahan saat ini"
					>
						<div class="mb-3 flex items-center gap-2 text-sm font-medium">
							<Eye size={16} aria-hidden="true" /> Pratinjau berdasarkan draft
						</div>
						<div class="space-y-3 rounded-lg bg-background p-3">
							<div class="flex min-h-10 items-center justify-between gap-3 border-b pb-3">
								<strong class="text-sm">CryptoSharia</strong>
								{#if effectiveNavbar}
									<span class="rounded-md border px-3 py-1 text-sm"
										>Academy <span aria-hidden="true">↗</span></span
									>
								{:else}
									<span class="text-sm text-muted-foreground">Menu Academy tidak dirender</span>
								{/if}
							</div>
							<div class="min-h-20 rounded-lg border p-3">
								{#if effectiveSection}
									<p class="text-xs font-semibold tracking-wide text-primary uppercase">
										CryptoSharia Academy
									</p>
									<p class="mt-1 text-sm font-medium">
										Belajar kripto secara terarah, dari dasar hingga perspektif syariah.
									</p>
								{:else}
									<p class="py-3 text-center text-sm text-muted-foreground">
										Section Academy tidak dirender; konten berikutnya naik tanpa ruang kosong.
									</p>
								{/if}
							</div>
						</div>
						<p class="mt-2 text-xs text-muted-foreground">
							Pratinjau ini hanya memakai draft di panel admin dan tidak mengubah website.
						</p>
					</div>

					<div
						class="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="min-h-5 text-sm" aria-live="polite">
							{#if dirty}
								<span class="font-medium text-amber-700 dark:text-amber-400"
									>Perubahan belum disimpan</span
								>
							{:else if saved}
								<span class="text-muted-foreground"
									>Tersimpan · versi {saved.version} · {formatUpdatedAt(saved.updatedAt)}</span
								>
							{/if}
						</div>
						<div class="flex flex-wrap justify-end gap-2">
							{#if dirty}
								<Button type="button" variant="outline" onclick={resetDraft} disabled={saving}>
									<RotateCcw size={16} class="mr-2" aria-hidden="true" /> Batal
								</Button>
							{/if}
							<Button type="submit" disabled={!dirty || saving}>
								{#if saving}<LoaderCircle
										size={16}
										class="mr-2 animate-spin"
										aria-hidden="true"
									/>{:else}<Save size={16} class="mr-2" aria-hidden="true" />{/if}
								{saving ? 'Menyimpan…' : 'Simpan Perubahan'}
							</Button>
						</div>
					</div>

					{#if errorMessage}
						<p
							class="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
							role="alert"
						>
							{errorMessage}
						</p>
					{/if}
					{#if successMessage}
						<p
							class="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400"
							role="status"
							aria-live="polite"
						>
							<CheckCircle2 size={17} aria-hidden="true" />
							{successMessage}
						</p>
					{/if}
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
