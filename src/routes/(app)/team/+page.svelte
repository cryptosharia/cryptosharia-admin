<script lang="ts">
	import { Plus, UsersRound, Search, Edit, Trash2, CheckCircle2, XCircle, ArrowUpDown } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let searchValue = $state('');
	$effect(() => {
		searchValue = data.search || '';
	});

	let deleteCandidate = $state<{ id: string; name: string } | null>(null);
	let isDeleting = $state(false);

	function handleSearch(e: Event) {
		e.preventDefault();
		const params = new URLSearchParams($page.url.searchParams);
		if (searchValue) {
			params.set('search', searchValue);
		} else {
			params.delete('search');
		}
		params.set('page', '1');
		goto(`?${params.toString()}`);
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Kenali Tim CryptoSharia</h1>
				<Badge variant="outline" class="font-normal text-xs">{data.total} anggota</Badge>
			</div>
			<p class="text-muted-foreground mt-2 text-sm sm:text-base">
				Kelola profil pengurus yang tampil di halaman 
				<a href="https://www.cryptosharia.id/tentang-kami" target="_blank" class="text-orange-500 hover:underline">
					cryptosharia.id/tentang-kami
				</a>
			</p>
		</div>
		<Button href="/team/new" class="gap-2 w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
			<Plus size={18} />
			Tambah Anggota Tim
		</Button>
	</div>

	<!-- Search & Filter Bar -->
	<div class="glass-card rounded-xl p-4 border border-border/50 bg-card/50">
		<div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
			<form onsubmit={handleSearch} class="relative flex-1 w-full max-w-md">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Cari berdasarkan nama, peran, atau fokus..."
					bind:value={searchValue}
					class="pl-9 bg-background/50 border-input"
				/>
			</form>
			<div class="flex items-center gap-2 self-start sm:self-auto">
				{#if data.search}
					<Button href="/team" variant="ghost" size="sm" class="text-xs">Hapus Filter</Button>
				{/if}
			</div>
		</div>
	</div>

	{#if data.error}
		<div class="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
			{data.error}
		</div>
	{/if}

	<!-- Team Members List -->
	{#if data.members.length === 0}
		<div class="glass-card rounded-2xl border border-dashed border-border p-12 text-center">
			<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
				<UsersRound class="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 class="mt-4 text-lg font-semibold">Belum ada anggota tim</h3>
			<p class="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
				{#if data.search}
					Tidak ditemukan anggota tim yang sesuai dengan kata kunci "{data.search}".
				{:else}
					Mulai tambahkan profil pengurus atau dewan komisioner CryptoSharia.
				{/if}
			</p>
			{#if data.search}
				<Button href="/team" variant="outline" size="sm" class="mt-4">Reset Pencarian</Button>
			{:else}
				<Button href="/team/new" size="sm" class="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
					<Plus size={16} class="mr-1.5" />
					Tambah Anggota
				</Button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4">
			{#each data.members as member (member.id)}
				<div class="glass-card rounded-xl border border-border/50 bg-card/60 p-4 sm:p-5 transition-all hover:border-orange-500/40 hover:shadow-md">
					<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<!-- Avatar and Info -->
						<div class="flex items-start gap-4 min-w-0">
							<div class="relative shrink-0">
								{#if member.image}
									<img
										src={member.image}
										alt={member.name}
										class="h-16 w-16 rounded-xl object-cover border border-border bg-muted/50"
									/>
								{:else}
									<div class="flex h-16 w-16 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 font-bold text-xl border border-border">
										{member.name.charAt(0)}
									</div>
								{/if}
								<span class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-[10px] font-semibold text-muted-foreground border border-border" title="Urutan prioritas">
									#{member.orderIndex}
								</span>
							</div>

							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="font-bold text-base sm:text-lg text-foreground truncate">
										{member.name}
									</h3>
									{#if member.credentials}
										<span class="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">
											{member.credentials}
										</span>
									{/if}
									{#if member.isActive}
										<Badge variant="outline" class="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[11px] gap-1 py-0">
											<CheckCircle2 size={12} />
											Aktif
										</Badge>
									{:else}
										<Badge variant="outline" class="border-rose-500/30 text-rose-500 bg-rose-500/10 text-[11px] gap-1 py-0">
											<XCircle size={12} />
											Nonaktif
										</Badge>
									{/if}
								</div>

								<div class="text-sm font-medium text-orange-500">
									{member.role}
								</div>

								<div class="text-xs text-muted-foreground">
									<span class="font-medium text-foreground/80">Fokus:</span> {member.focus}
								</div>

								{#if member.expertise && member.expertise.length > 0}
									<div class="flex flex-wrap gap-1.5 pt-1">
										{#each member.expertise as item}
											<span class="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/40">
												{item.title}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						</div>

						<!-- Action Buttons -->
						<div class="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
							<!-- Toggle Status -->
							<form
								method="POST"
								action="?/toggleActive"
								use:enhance={() => {
									return async ({ result, update }) => {
										await update();
										if (result.type === 'success') {
											toast.success(`Status ${member.name} berhasil diubah.`);
										} else {
											toast.error('Gagal mengubah status.');
										}
									};
								}}
							>
								<input type="hidden" name="id" value={member.id} />
								<input type="hidden" name="isActive" value={String(member.isActive)} />
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									class="text-xs text-muted-foreground hover:text-foreground"
									title={member.isActive ? 'Nonaktifkan dari website' : 'Aktifkan di website'}
								>
									{member.isActive ? 'Nonaktifkan' : 'Aktifkan'}
								</Button>
							</form>

							<!-- Edit -->
							<Button
								href={`/team/${member.id}`}
								variant="outline"
								size="sm"
								class="gap-1.5 text-xs"
							>
								<Edit size={14} />
								Edit
							</Button>

							<!-- Delete Button -->
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onclick={() => (deleteCandidate = { id: member.id, name: member.name })}
								class="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs p-2"
								title="Hapus profil"
							>
								<Trash2 size={15} />
							</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal Konfirmasi Hapus -->
{#if deleteCandidate}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="glass-card max-w-md w-full rounded-2xl border border-border p-6 shadow-2xl space-y-4 bg-card">
			<div class="space-y-2">
				<h3 class="text-lg font-bold text-foreground">Hapus Anggota Tim?</h3>
				<p class="text-sm text-muted-foreground">
					Apakah Anda yakin ingin menghapus profil <strong>{deleteCandidate.name}</strong>? Tindakan ini tidak dapat dibatalkan.
				</p>
			</div>

			<div class="flex items-center justify-end gap-3 pt-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={() => (deleteCandidate = null)}
					disabled={isDeleting}
				>
					Batal
				</Button>

				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						isDeleting = true;
						return async ({ result, update }) => {
							isDeleting = false;
							deleteCandidate = null;
							await update();
							if (result.type === 'success') {
								toast.success('Anggota tim berhasil dihapus.');
							} else {
								toast.error('Gagal menghapus anggota tim.');
							}
						};
					}}
				>
					<input type="hidden" name="id" value={deleteCandidate.id} />
					<Button
						type="submit"
						variant="destructive"
						size="sm"
						disabled={isDeleting}
						class="gap-1.5"
					>
						{#if isDeleting}
							Menghapus...
						{:else}
							<Trash2 size={14} />
							Hapus
						{/if}
					</Button>
				</form>
			</div>
		</div>
	</div>
{/if}
