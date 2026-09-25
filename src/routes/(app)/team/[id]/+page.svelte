<script lang="ts">
	import { ArrowLeft, Save, Plus, Trash2, Sparkles, Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { resolveTeamImageUrl } from '$lib/team-image';

	let { data, form } = $props();

	let member = $derived(data.member);

	let isSubmitting = $state(false);

	let name = $state('');
	let slug = $state('');
	let credentials = $state('');
	let role = $state('');
	let focus = $state('');
	let contribution = $state('');
	let joined = $state('');
	let description = $state('');
	let orderIndex = $state(0);
	let isActive = $state(true);
	let imageUrl = $state('');

	// Dynamic Area Keahlian
	let expertiseList = $state<Array<{ title: string; description: string }>>([
		{ title: '', description: '' }
	]);

	$effect(() => {
		if (member) {
			name = member.name || '';
			slug = member.slug || '';
			credentials = member.credentials || '';
			role = member.role || '';
			focus = member.focus || '';
			contribution = member.contribution || '';
			joined = member.joined || '';
			description = member.description || '';
			orderIndex = member.orderIndex ?? 0;
			isActive = member.isActive ?? true;
			imageUrl = member.imageUrl || '';
			if (member.expertise && member.expertise.length > 0) {
				expertiseList = [...member.expertise];
			}
		}
	});

	function addExpertise() {
		expertiseList = [...expertiseList, { title: '', description: '' }];
	}

	function removeExpertise(index: number) {
		expertiseList = expertiseList.filter((_, i) => i !== index);
	}

	const expertiseJson = $derived(
		JSON.stringify(expertiseList.filter((item) => item.title.trim() && item.description.trim()))
	);
</script>

<div class="max-w-4xl mx-auto space-y-6 pb-12">
	<!-- Top Bar -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Button href="/team" variant="outline" size="sm" class="h-9 w-9 p-0 rounded-full">
				<ArrowLeft size={16} />
			</Button>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-foreground">Edit Anggota Tim</h1>
				<p class="text-sm text-muted-foreground">Ubah informasi profil {member.name}</p>
			</div>
		</div>
	</div>

	{#if form?.message}
		<div class="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	<form
		method="POST"
		enctype="multipart/form-data"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				if (result.type === 'failure') {
					toast.error((result.data as any)?.message || 'Gagal menyimpan perubahan.');
				}
				await update();
			};
		}}
		class="space-y-6"
	>
		<input type="hidden" name="expertise" value={expertiseJson} />

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Foto Profil & Status (Kolom Kiri) -->
			<div class="space-y-6">
				<Card class="border-border/50 bg-card/60">
					<CardHeader class="pb-3">
						<CardTitle class="text-base">Foto Profil</CardTitle>
						<CardDescription class="text-xs">Foto resmi anggota tim</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<ImageUpload
							name="image"
							label="Foto Profil"
							aspectRatio="square"
							currentUrl={resolveTeamImageUrl(member.image || member.imageUrl)}
						/>

						<div class="space-y-1.5 pt-2 border-t border-border/40">
							<label for="imageUrl" class="text-xs font-medium text-muted-foreground">
								Atau URL Foto Langsung
							</label>
							<Input
								id="imageUrl"
								name="imageUrl"
								type="text"
								placeholder="/team/... atau https://..."
								bind:value={imageUrl}
								class="text-xs"
							/>
						</div>
					</CardContent>
				</Card>

				<Card class="border-border/50 bg-card/60">
					<CardHeader class="pb-3">
						<CardTitle class="text-base">Pengaturan Tampilan</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-1.5">
							<label for="orderIndex" class="text-xs font-medium">Urutan Tampilan</label>
							<Input
								id="orderIndex"
								name="orderIndex"
								type="number"
								bind:value={orderIndex}
								class="text-sm"
							/>
							<p class="text-[11px] text-muted-foreground">Angka lebih kecil tampil lebih awal (0, 1, 2...)</p>
						</div>

						<div class="flex items-center justify-between pt-2 border-t border-border/40">
							<span class="text-sm font-medium">Tampilkan ke Publik</span>
							<label class="relative inline-flex items-center cursor-pointer">
								<input type="checkbox" name="isActive" bind:checked={isActive} class="sr-only peer" />
								<div class="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
							</label>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Data Utama (Kolom Kanan) -->
			<div class="md:col-span-2 space-y-6">
				<Card class="border-border/50 bg-card/60">
					<CardHeader class="pb-4">
						<CardTitle class="text-lg">Informasi Profil</CardTitle>
						<CardDescription class="text-xs">Data identitas dan peran anggota tim</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<label for="name" class="text-xs font-semibold text-foreground">
									Nama Lengkap <span class="text-destructive">*</span>
								</label>
								<Input
									id="name"
									name="name"
									required
									placeholder="Contoh: Sholahuddin Al Ayyubi"
									bind:value={name}
								/>
							</div>

							<div class="space-y-1.5">
								<label for="credentials" class="text-xs font-medium text-muted-foreground">
									Gelar / Kredensial
								</label>
								<Input
									id="credentials"
									name="credentials"
									placeholder="Contoh: B.B.A., M.Sc. atau S.Kom., Lc."
									bind:value={credentials}
								/>
							</div>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<label for="role" class="text-xs font-semibold text-foreground">
									Jabatan / Peran <span class="text-destructive">*</span>
								</label>
								<Input
									id="role"
									name="role"
									required
									placeholder="Contoh: Chief Executive Officer atau Board of Commissioners"
									bind:value={role}
								/>
							</div>

							<div class="space-y-1.5">
								<label for="slug" class="text-xs font-medium text-muted-foreground">
									Slug / ID Singkat
								</label>
								<Input
									id="slug"
									name="slug"
									placeholder="sholahuddin"
									bind:value={slug}
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="focus" class="text-xs font-semibold text-foreground">
								Fokus Bidang <span class="text-destructive">*</span>
							</label>
							<Input
								id="focus"
								name="focus"
								required
								placeholder="Contoh: Strategi Perusahaan & Partnership"
								bind:value={focus}
							/>
						</div>

						<div class="space-y-1.5">
							<label for="description" class="text-xs font-semibold text-foreground">
								Deskripsi / Ringkasan Peran <span class="text-destructive">*</span>
							</label>
							<Textarea
								id="description"
								name="description"
								required
								rows={3}
								placeholder="Memimpin arah perusahaan, pengembangan kemitraan, dan pengambilan keputusan strategis CryptoSharia."
								bind:value={description}
							/>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<label for="contribution" class="text-xs font-medium text-muted-foreground">
									Kontribusi (opsional)
								</label>
								<Textarea
									id="contribution"
									name="contribution"
									rows={2}
									placeholder="Contoh: Pemateri MasterClass CryptoSharia 2026..."
									bind:value={contribution}
								/>
							</div>

							<div class="space-y-1.5">
								<label for="joined" class="text-xs font-medium text-muted-foreground">
									Waktu Bergabung (opsional)
								</label>
								<Input
									id="joined"
									name="joined"
									placeholder="Contoh: 25 Mei 2025"
									bind:value={joined}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Area Keahlian (Expertise Dynamic List) -->
				<Card class="border-border/50 bg-card/60">
					<CardHeader class="pb-3 flex flex-row items-center justify-between">
						<div>
							<CardTitle class="text-base flex items-center gap-2">
								<Sparkles size={16} class="text-orange-500" />
								Area Keahlian
							</CardTitle>
							<CardDescription class="text-xs">
								Badge keahlian spesifik yang tampil di kartu detail profil
							</CardDescription>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={addExpertise}
							class="text-xs gap-1"
						>
							<Plus size={14} />
							Tambah Keahlian
						</Button>
					</CardHeader>
					<CardContent class="space-y-3">
						{#each expertiseList as item, index}
							<div class="flex items-start gap-2 p-3 rounded-lg border border-border/50 bg-background/50">
								<div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
									<Input
										placeholder="Judul (misal: Fikih Muamalah)"
										bind:value={item.title}
										class="text-xs"
									/>
									<Input
										placeholder="Keterangan singkat (misal: Prinsip transaksi dalam Islam)"
										bind:value={item.description}
										class="text-xs"
									/>
								</div>
								{#if expertiseList.length > 1}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => removeExpertise(index)}
										class="text-destructive hover:bg-destructive/10 p-2 h-9 w-9 shrink-0"
									>
										<Trash2 size={14} />
									</Button>
								{/if}
							</div>
						{/each}
					</CardContent>
				</Card>

				<!-- Save Button -->
				<div class="flex items-center justify-end gap-3 pt-2">
					<Button href="/team" variant="outline">
						Batal
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting}
						class="bg-orange-500 hover:bg-orange-600 text-white min-w-[140px] gap-2 shadow-lg shadow-orange-500/20"
					>
						{#if isSubmitting}
							<Loader2 size={16} class="animate-spin" />
							Menyimpan...
						{:else}
							<Save size={16} />
							Simpan Perubahan
						{/if}
					</Button>
				</div>
			</div>
		</div>
	</form>
</div>
