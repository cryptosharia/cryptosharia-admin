<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Layers,
		ChevronRight,
		AlertCircle,
		CheckCircle2,
		XCircle,
		Plus,
		Search,
		Edit3,
		Loader2,
		X,
		Check,
		Filter
	} from 'lucide-svelte';
	import { untrack } from 'svelte';
	import type { ScopeDto } from '$lib/academyDtos';

	let { data } = $props();

	// Local mutable scopes list initialized from SSR data
	let scopes = $state<ScopeDto[]>(untrack(() => data.scopes ?? []));
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'inactive'>('all');

	// Create Modal state
	let isCreateModalOpen = $state(false);
	let createId = $state('');
	let createName = $state('');
	let createDescription = $state('');
	let createIsActive = $state(true);
	let isSubmittingCreate = $state(false);
	let createError = $state<string | null>(null);

	// Edit Modal state
	let isEditModalOpen = $state(false);
	let editingScope = $state<ScopeDto | null>(null);
	let editName = $state('');
	let editDescription = $state('');
	let editIsActive = $state(true);
	let isSubmittingEdit = $state(false);
	let editError = $state<string | null>(null);

	// Feedback message
	let feedbackMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	function showFeedback(type: 'success' | 'error', text: string) {
		feedbackMessage = { type, text };
		setTimeout(() => {
			if (feedbackMessage?.text === text) {
				feedbackMessage = null;
			}
		}, 4000);
	}

	// Filtered scopes
	let filteredScopes = $derived(
		scopes.filter((s) => {
			const matchesSearch =
				!searchQuery ||
				s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'active' && s.isActive) ||
				(statusFilter === 'inactive' && !s.isActive);

			return matchesSearch && matchesStatus;
		})
	);

	function openCreateModal() {
		createId = '';
		createName = '';
		createDescription = '';
		createIsActive = true;
		createError = null;
		isCreateModalOpen = true;
	}

	function openEditModal(scope: ScopeDto) {
		editingScope = scope;
		editName = scope.name;
		editDescription = scope.description || '';
		editIsActive = scope.isActive;
		editError = null;
		isEditModalOpen = true;
	}

	async function handleCreateScope() {
		createError = null;
		const id = createId.trim().toLowerCase();
		const name = createName.trim();

		if (!id) {
			createError = 'ID Scope wajib diisi (misal: "crypto-starter").';
			return;
		}
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
			createError = 'ID Scope hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).';
			return;
		}
		if (!name) {
			createError = 'Nama Scope wajib diisi.';
			return;
		}

		isSubmittingCreate = true;
		try {
			const res = await fetch('/api/academy/admin/scopes', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					id,
					name,
					description: createDescription.trim(),
					isActive: createIsActive
				})
			});

			const body = await res.json();
			if (!res.ok) {
				createError = body.message || 'Gagal membuat scope baru.';
				return;
			}

			// Success: add to local list
			scopes = [...scopes, body];
			isCreateModalOpen = false;
			showFeedback('success', `Scope "${body.name}" berhasil dibuat.`);
		} catch (err) {
			createError = 'Terjadi kesalahan jaringan saat membuat scope.';
		} finally {
			isSubmittingCreate = false;
		}
	}

	async function handleEditScope() {
		if (!editingScope) return;
		editError = null;
		const name = editName.trim();

		if (!name) {
			editError = 'Nama Scope tidak boleh kosong.';
			return;
		}

		isSubmittingEdit = true;
		try {
			const res = await fetch(`/api/academy/admin/scopes/${encodeURIComponent(editingScope.id)}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name,
					description: editDescription.trim(),
					isActive: editIsActive
				})
			});

			const body = await res.json();
			if (!res.ok) {
				editError = body.message || 'Gagal memperbarui scope.';
				return;
			}

			// Success: update in local list
			scopes = scopes.map((s) => (s.id === editingScope?.id ? { ...s, ...body } : s));
			isEditModalOpen = false;
			showFeedback('success', `Scope "${body.name}" berhasil diperbarui.`);
		} catch (err) {
			editError = 'Terjadi kesalahan jaringan saat memperbarui scope.';
		} finally {
			isSubmittingEdit = false;
		}
	}

	async function toggleActiveStatus(scope: ScopeDto) {
		try {
			const res = await fetch(`/api/academy/admin/scopes/${encodeURIComponent(scope.id)}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					isActive: !scope.isActive
				})
			});

			const body = await res.json();
			if (res.ok) {
				scopes = scopes.map((s) => (s.id === scope.id ? { ...s, isActive: !scope.isActive } : s));
				showFeedback('success', `Status scope "${scope.name}" diubah menjadi ${!scope.isActive ? 'Aktif' : 'Nonaktif'}.`);
			} else {
				showFeedback('error', body.message || 'Gagal mengubah status scope.');
			}
		} catch {
			showFeedback('error', 'Terjadi kesalahan jaringan saat mengubah status scope.');
		}
	}
</script>

<svelte:head>
	<title>Scopes & Entitlements | CryptoSharia Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 text-xs text-muted-foreground mb-1">
				<a href={resolve('/academy/overview')} class="hover:underline">Academy</a>
				<ChevronRight class="h-3 w-3" />
				<span class="text-foreground">Scopes & Entitlements</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
				<Layers class="h-6 w-6 text-orange-500" />
				Tingkatan Akses (Scopes)
			</h1>
			<p class="text-sm text-muted-foreground">
				Konfigurasi batasan akses materi pembelajaran untuk peserta CryptoSharia Academy.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<button
				onclick={openCreateModal}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50"
			>
				<Plus class="h-4 w-4" />
				Tambah Scope
			</button>
		</div>
	</div>

	<!-- Notifications / Feedback -->
	{#if feedbackMessage}
		<div
			class="rounded-lg p-3.5 text-sm flex items-center gap-2.5 transition-all {feedbackMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}"
		>
			{#if feedbackMessage.type === 'success'}
				<CheckCircle2 class="h-4 w-4 shrink-0" />
			{:else}
				<AlertCircle class="h-4 w-4 shrink-0" />
			{/if}
			<span>{feedbackMessage.text}</span>
		</div>
	{/if}

	{#if data.error}
		<div class="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-500 flex items-center gap-3">
			<AlertCircle class="h-5 w-5 shrink-0" />
			<p class="text-sm font-medium">{data.error}</p>
		</div>
	{/if}

	<!-- Controls: Search & Filter -->
	<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
		<div class="relative flex-1 max-w-md">
			<Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Cari scope berdasarkan ID, nama, deskripsi..."
				class="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
			/>
		</div>

		<div class="flex items-center gap-2">
			<div class="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
				<Filter class="h-3.5 w-3.5" /> Filter:
			</div>
			<select
				bind:value={statusFilter}
				class="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
			>
				<option value="all">Semua Status ({scopes.length})</option>
				<option value="active">Aktif ({scopes.filter(s => s.isActive).length})</option>
				<option value="inactive">Nonaktif ({scopes.filter(s => !s.isActive).length})</option>
			</select>
		</div>
	</div>

	<!-- Scopes Table -->
	<div class="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
		<div class="p-4 border-b border-border flex items-center justify-between bg-muted/20">
			<span class="text-sm font-semibold text-foreground">
				Daftar Scopes {filteredScopes.length !== scopes.length ? `(${filteredScopes.length} dari ${scopes.length})` : `(${scopes.length})`}
			</span>
		</div>

		{#if filteredScopes.length === 0}
			<div class="p-12 text-center text-muted-foreground text-sm">
				{#if searchQuery || statusFilter !== 'all'}
					Tidak ada scope yang cocok dengan pencarian atau filter saat ini.
				{:else}
					Belum ada scope yang terdaftar. Klik tombol <strong>Tambah Scope</strong> untuk membuat.
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm text-left">
					<thead class="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
						<tr>
							<th class="px-4 py-3">ID Scope</th>
							<th class="px-4 py-3">Nama Tingkatan</th>
							<th class="px-4 py-3">Deskripsi</th>
							<th class="px-4 py-3 text-center">Status</th>
							<th class="px-4 py-3 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredScopes as scope}
							<tr class="hover:bg-muted/20 transition-colors">
								<td class="px-4 py-3">
									<span class="font-mono text-xs px-2 py-0.5 rounded bg-muted text-foreground border border-border font-medium">
										{scope.id}
									</span>
								</td>
								<td class="px-4 py-3 font-medium text-foreground">
									{scope.name}
								</td>
								<td class="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
									{scope.description || '-'}
								</td>
								<td class="px-4 py-3 text-center">
									{#if scope.isActive}
										<span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
											<CheckCircle2 class="h-3 w-3" /> Aktif
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
											<XCircle class="h-3 w-3" /> Nonaktif
										</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
									<button
										onclick={() => openEditModal(scope)}
										class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-border bg-background hover:bg-muted text-foreground transition-colors"
										title="Ubah Scope"
									>
										<Edit3 class="h-3 w-3" /> Edit
									</button>
									<button
										onclick={() => toggleActiveStatus(scope)}
										class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border transition-colors {scope.isActive ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}"
									>
										{scope.isActive ? 'Nonaktifkan' : 'Aktifkan'}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- ========================================================================= -->
<!-- MODAL: Tambah Scope Baru -->
<!-- ========================================================================= -->
{#if isCreateModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
		<div class="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
			<div class="flex items-center justify-between border-b border-border pb-3">
				<h3 class="font-bold text-foreground text-lg flex items-center gap-2">
					<Plus class="h-5 w-5 text-orange-500" />
					Tambah Scope Baru
				</h3>
				<button
					onclick={() => isCreateModalOpen = false}
					class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			{#if createError}
				<div class="rounded-lg p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
					<AlertCircle class="h-4 w-4 shrink-0" />
					<span>{createError}</span>
				</div>
			{/if}

			<div class="space-y-3 text-sm">
				<div>
					<label for="create-scope-id" class="block text-xs font-medium text-foreground mb-1">
						ID Scope (Slug) <span class="text-orange-500">*</span>
					</label>
					<input
						id="create-scope-id"
						type="text"
						bind:value={createId}
						placeholder="contoh: crypto-starter, vip-access"
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 font-mono"
					/>
					<p class="text-[11px] text-muted-foreground mt-1">
						Hanya huruf kecil, angka, dan tanda hubung (-). Tidak dapat diubah setelah dibuat.
					</p>
				</div>

				<div>
					<label for="create-scope-name" class="block text-xs font-medium text-foreground mb-1">
						Nama Tingkatan <span class="text-orange-500">*</span>
					</label>
					<input
						id="create-scope-name"
						type="text"
						bind:value={createName}
						placeholder="contoh: Starter Tier, VIP Member"
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
					/>
				</div>

				<div>
					<label for="create-scope-desc" class="block text-xs font-medium text-foreground mb-1">
						Deskripsi
					</label>
					<textarea
						id="create-scope-desc"
						bind:value={createDescription}
						rows="3"
						placeholder="Deskripsi hak akses scope ini..."
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 resize-none"
					></textarea>
				</div>

				<div class="flex items-center gap-2 pt-1">
					<input
						id="create-is-active"
						type="checkbox"
						bind:checked={createIsActive}
						class="rounded border-border text-orange-600 focus:ring-orange-500 bg-background h-4 w-4"
					/>
					<label for="create-is-active" class="text-xs text-foreground cursor-pointer">
						Scope langsung aktif setelah dibuat
					</label>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 border-t border-border pt-3">
				<button
					type="button"
					onclick={() => isCreateModalOpen = false}
					disabled={isSubmittingCreate}
					class="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={handleCreateScope}
					disabled={isSubmittingCreate}
					class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50"
				>
					{#if isSubmittingCreate}
						<Loader2 class="h-3.5 w-3.5 animate-spin" />
						Menyimpan...
					{:else}
						<Check class="h-3.5 w-3.5" />
						Simpan Scope
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL: Edit Scope -->
<!-- ========================================================================= -->
{#if isEditModalOpen && editingScope}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
		<div class="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
			<div class="flex items-center justify-between border-b border-border pb-3">
				<h3 class="font-bold text-foreground text-lg flex items-center gap-2">
					<Edit3 class="h-5 w-5 text-orange-500" />
					Ubah Scope: <span class="font-mono text-muted-foreground text-sm">{editingScope.id}</span>
				</h3>
				<button
					onclick={() => isEditModalOpen = false}
					class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			{#if editError}
				<div class="rounded-lg p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
					<AlertCircle class="h-4 w-4 shrink-0" />
					<span>{editError}</span>
				</div>
			{/if}

			<div class="space-y-3 text-sm">
				<div>
					<label for="edit-scope-name" class="block text-xs font-medium text-foreground mb-1">
						Nama Tingkatan <span class="text-orange-500">*</span>
					</label>
					<input
						id="edit-scope-name"
						type="text"
						bind:value={editName}
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
					/>
				</div>

				<div>
					<label for="edit-scope-desc" class="block text-xs font-medium text-foreground mb-1">
						Deskripsi
					</label>
					<textarea
						id="edit-scope-desc"
						bind:value={editDescription}
						rows="3"
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 resize-none"
					></textarea>
				</div>

				<div class="flex items-center gap-2 pt-1">
					<input
						id="edit-is-active"
						type="checkbox"
						bind:checked={editIsActive}
						class="rounded border-border text-orange-600 focus:ring-orange-500 bg-background h-4 w-4"
					/>
					<label for="edit-is-active" class="text-xs text-foreground cursor-pointer">
						Status Aktif
					</label>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 border-t border-border pt-3">
				<button
					type="button"
					onclick={() => isEditModalOpen = false}
					disabled={isSubmittingEdit}
					class="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={handleEditScope}
					disabled={isSubmittingEdit}
					class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50"
				>
					{#if isSubmittingEdit}
						<Loader2 class="h-3.5 w-3.5 animate-spin" />
						Menyimpan...
					{:else}
						<Check class="h-3.5 w-3.5" />
						Perbarui Scope
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
