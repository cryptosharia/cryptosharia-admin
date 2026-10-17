<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		KeyRound,
		ChevronRight,
		AlertCircle,
		CheckCircle2,
		XCircle,
		Plus,
		Search,
		UserCheck,
		Calendar,
		Ban,
		Loader2,
		X,
		Check,
		Filter,
		Shield,
		Clock
	} from 'lucide-svelte';
	import { untrack } from 'svelte';
	import type { AdminGrantDto, ScopeDto } from '$lib/academyDtos';

	interface StudentResult {
		id: string;
		name: string;
		email: string;
		avatarUrl?: string;
	}

	let { data } = $props();

	let grants = $state<AdminGrantDto[]>(untrack(() => data.grants ?? []));
	let scopes = $derived<ScopeDto[]>(data.scopes ?? []);

	// Table search & filter state
	let searchQuery = $state('');
	let scopeFilter = $state<string>('all');
	let statusFilter = $state<'all' | 'active' | 'revoked'>('all');

	// Create Grant Modal state
	let isCreateModalOpen = $state(false);
	let studentSearchQuery = $state('');
	let isSearchingStudents = $state(false);
	let searchedStudents = $state<StudentResult[]>([]);
	let selectedStudent = $state<StudentResult | null>(null);
	let manualUserId = $state('');
	let isManualUserMode = $state(false);

	let selectedScopeId = $state('');
	let durationPreset = $state<'30' | '90' | '365' | 'lifetime' | 'custom'>('90');
	let customExpiresAt = $state('');
	let isSubmittingCreate = $state(false);
	let createError = $state<string | null>(null);

	// Revoke Modal state
	let isRevokeModalOpen = $state(false);
	let grantToRevoke = $state<AdminGrantDto | null>(null);
	let isSubmittingRevoke = $state(false);
	let revokeError = $state<string | null>(null);

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

	// Filtered grants
	let filteredGrants = $derived(
		grants.filter((g) => {
			const matchesSearch =
				!searchQuery ||
				g.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
				g.scopeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
				g.id.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesScope = scopeFilter === 'all' || g.scopeId === scopeFilter;
			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'active' && g.state === 'active') ||
				(statusFilter === 'revoked' && g.state === 'revoked');

			return matchesSearch && matchesScope && matchesStatus;
		})
	);

	let activeCount = $derived(grants.filter((g) => g.state === 'active').length);
	let revokedCount = $derived(grants.filter((g) => g.state === 'revoked').length);

	// Student search debounced
	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleStudentSearchInput() {
		clearTimeout(searchTimeout);
		if (!studentSearchQuery.trim()) {
			searchedStudents = [];
			return;
		}

		searchTimeout = setTimeout(async () => {
			isSearchingStudents = true;
			try {
				const res = await fetch(
					`/api/academy/admin/users/search?q=${encodeURIComponent(studentSearchQuery.trim())}`
				);
				if (res.ok) {
					searchedStudents = await res.json();
				} else {
					searchedStudents = [];
				}
			} catch {
				searchedStudents = [];
			} finally {
				isSearchingStudents = false;
			}
		}, 300);
	}

	function selectStudent(student: StudentResult) {
		selectedStudent = student;
		studentSearchQuery = '';
		searchedStudents = [];
	}

	function openCreateModal() {
		selectedStudent = null;
		studentSearchQuery = '';
		searchedStudents = [];
		manualUserId = '';
		isManualUserMode = false;
		selectedScopeId = scopes.find((s) => s.isActive)?.id || scopes[0]?.id || '';
		durationPreset = '90';
		customExpiresAt = '';
		createError = null;
		isCreateModalOpen = true;
	}

	function calculateExpirationDate(): string {
		const now = new Date();
		if (durationPreset === '30') {
			now.setDate(now.getDate() + 30);
			return now.toISOString();
		} else if (durationPreset === '90') {
			now.setDate(now.getDate() + 90);
			return now.toISOString();
		} else if (durationPreset === '365') {
			now.setDate(now.getDate() + 365);
			return now.toISOString();
		} else if (durationPreset === 'lifetime') {
			now.setFullYear(now.getFullYear() + 20); // 20 years for lifetime
			return now.toISOString();
		} else if (durationPreset === 'custom' && customExpiresAt) {
			return new Date(customExpiresAt).toISOString();
		}
		// Default 90 days
		now.setDate(now.getDate() + 90);
		return now.toISOString();
	}

	async function handleCreateGrant() {
		createError = null;
		const userId = isManualUserMode ? manualUserId.trim() : selectedStudent?.id;

		if (!userId) {
			createError = 'Pilih siswa dari pencarian atau masukkan User ID.';
			return;
		}

		if (!selectedScopeId) {
			createError = 'Pilih Scope tingkatan akses yang akan diberikan.';
			return;
		}

		if (durationPreset === 'custom' && !customExpiresAt) {
			createError = 'Tentukan tanggal kedaluwarsa kustom.';
			return;
		}

		const expiresAt = calculateExpirationDate();
		const startsAt = new Date().toISOString();

		isSubmittingCreate = true;
		try {
			const res = await fetch('/api/academy/admin/grants', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					userId,
					scopeId: selectedScopeId,
					startsAt,
					expiresAt,
					source: 'manual'
				})
			});

			const body = await res.json();
			if (!res.ok) {
				createError = body.message || 'Gagal memberikan hak akses grant.';
				return;
			}

			// Success
			grants = [body, ...grants];
			isCreateModalOpen = false;
			showFeedback('success', `Akses scope "${selectedScopeId}" berhasil diberikan ke pengguna.`);
		} catch {
			createError = 'Terjadi kesalahan jaringan saat membuat grant.';
		} finally {
			isSubmittingCreate = false;
		}
	}

	function openRevokeModal(grant: AdminGrantDto) {
		grantToRevoke = grant;
		revokeError = null;
		isRevokeModalOpen = true;
	}

	async function handleRevokeGrant() {
		if (!grantToRevoke) return;
		revokeError = null;
		isSubmittingRevoke = true;

		try {
			const res = await fetch(`/api/academy/admin/grants/${encodeURIComponent(grantToRevoke.id)}/revoke`, {
				method: 'PUT'
			});

			const body = await res.json();
			if (!res.ok) {
				revokeError = body.message || 'Gagal mencabut hak akses grant.';
				return;
			}

			// Success
			grants = grants.map((g) => (g.id === grantToRevoke?.id ? { ...g, state: 'revoked' } : g));
			isRevokeModalOpen = false;
			showFeedback('success', `Hak akses scope "${grantToRevoke.scopeId}" berhasil dicabut.`);
		} catch {
			revokeError = 'Terjadi kesalahan jaringan saat mencabut grant.';
		} finally {
			isSubmittingRevoke = false;
		}
	}

	function getScopeName(id: string) {
		return scopes.find((s) => s.id === id)?.name || id;
	}
</script>

<svelte:head>
	<title>Hak Akses Siswa (Grants) | CryptoSharia Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 text-xs text-muted-foreground mb-1">
				<a href={resolve('/academy/overview')} class="hover:underline">Academy</a>
				<ChevronRight class="h-3 w-3" />
				<span class="text-foreground">Student Grants</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
				<KeyRound class="h-6 w-6 text-orange-500" />
				Hak Akses Siswa (Grants)
			</h1>
			<p class="text-sm text-muted-foreground">
				Entitlement dan izin akses materi pembelajaran untuk akun siswa CryptoSharia.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<button
				onclick={openCreateModal}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50"
			>
				<Plus class="h-4 w-4" />
				Beri Akses Siswa
			</button>
		</div>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5">
			<div class="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
				<KeyRound class="h-5 w-5" />
			</div>
			<div>
				<div class="text-2xl font-bold text-foreground">{grants.length}</div>
				<div class="text-xs text-muted-foreground">Total Grants Diterbitkan</div>
			</div>
		</div>

		<div class="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5">
			<div class="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
				<UserCheck class="h-5 w-5" />
			</div>
			<div>
				<div class="text-2xl font-bold text-emerald-400">{activeCount}</div>
				<div class="text-xs text-muted-foreground">Akses Aktif</div>
			</div>
		</div>

		<div class="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5">
			<div class="h-10 w-10 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-400">
				<Ban class="h-5 w-5" />
			</div>
			<div>
				<div class="text-2xl font-bold text-zinc-400">{revokedCount}</div>
				<div class="text-xs text-muted-foreground">Akses Dicabut / Expired</div>
			</div>
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

	<!-- Controls: Search & Filters -->
	<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
		<div class="relative flex-1 max-w-md">
			<Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Cari berdasarkan User ID, Scope ID, Grant ID..."
				class="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
			/>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<!-- Scope filter -->
			<select
				bind:value={scopeFilter}
				class="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
			>
				<option value="all">Semua Scope</option>
				{#each scopes as scope}
					<option value={scope.id}>{scope.name} ({scope.id})</option>
				{/each}
			</select>

			<!-- Status filter -->
			<select
				bind:value={statusFilter}
				class="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
			>
				<option value="all">Semua Status</option>
				<option value="active">Aktif</option>
				<option value="revoked">Dicabut</option>
			</select>
		</div>
	</div>

	<!-- Grants Table -->
	<div class="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
		<div class="p-4 border-b border-border flex items-center justify-between bg-muted/20">
			<span class="text-sm font-semibold text-foreground">
				Daftar Hak Akses {filteredGrants.length !== grants.length ? `(${filteredGrants.length} dari ${grants.length})` : `(${grants.length})`}
			</span>
		</div>

		{#if filteredGrants.length === 0}
			<div class="p-12 text-center text-muted-foreground text-sm">
				{#if searchQuery || scopeFilter !== 'all' || statusFilter !== 'all'}
					Tidak ada grant yang cocok dengan filter atau pencarian saat ini.
				{:else}
					Belum ada hak akses siswa yang terdaftar. Klik tombol <strong>Beri Akses Siswa</strong> untuk menambahkan.
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm text-left">
					<thead class="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
						<tr>
							<th class="px-4 py-3">Siswa (User ID)</th>
							<th class="px-4 py-3">Tingkatan (Scope)</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Masa Berlaku</th>
							<th class="px-4 py-3">Sumber</th>
							<th class="px-4 py-3 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredGrants as grant}
							<tr class="hover:bg-muted/20 transition-colors">
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<div class="h-7 w-7 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
											U
										</div>
										<div class="min-w-0">
											<div class="font-mono text-xs text-foreground font-medium truncate max-w-[200px]" title={grant.userId}>
												{grant.userId}
											</div>
											<div class="text-[10px] text-muted-foreground font-mono">
												ID: {grant.id.slice(0, 8)}...
											</div>
										</div>
									</div>
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center gap-1.5">
										<Shield class="h-3.5 w-3.5 text-orange-500 shrink-0" />
										<span class="font-medium text-foreground">{getScopeName(grant.scopeId)}</span>
										<span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
											{grant.scopeId}
										</span>
									</div>
								</td>
								<td class="px-4 py-3">
									{#if grant.state === 'active'}
										<span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
											<CheckCircle2 class="h-3 w-3" /> Aktif
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
											<Ban class="h-3 w-3" /> Dicabut
										</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
									<div class="flex items-center gap-1">
										<Calendar class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
										<span>{grant.startsAt ? new Date(grant.startsAt).toLocaleDateString('id-ID') : '-'}</span>
										<span>&rarr;</span>
										<span class="font-medium text-foreground">{grant.expiresAt ? new Date(grant.expiresAt).toLocaleDateString('id-ID') : 'Selamanya'}</span>
									</div>
								</td>
								<td class="px-4 py-3 text-xs text-muted-foreground uppercase font-mono">
									{grant.source || 'manual'}
								</td>
								<td class="px-4 py-3 text-right">
									{#if grant.state === 'active'}
										<button
											onclick={() => openRevokeModal(grant)}
											class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
											title="Cabut Hak Akses"
										>
											<Ban class="h-3 w-3" /> Cabut
										</button>
									{:else}
										<span class="text-xs text-muted-foreground italic">Nonaktif</span>
									{/if}
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
<!-- MODAL: Beri Hak Akses Siswa (Create Grant) -->
<!-- ========================================================================= -->
{#if isCreateModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
		<div class="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
			<div class="flex items-center justify-between border-b border-border pb-3">
				<h3 class="font-bold text-foreground text-lg flex items-center gap-2">
					<KeyRound class="h-5 w-5 text-orange-500" />
					Beri Hak Akses Siswa (Grant)
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

			<div class="space-y-4 text-sm">
				<!-- Student Selection -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<span class="block text-xs font-medium text-foreground">
							Pilih Siswa <span class="text-orange-500">*</span>
						</span>
						<button
							type="button"
							onclick={() => { isManualUserMode = !isManualUserMode; selectedStudent = null; }}
							class="text-[11px] text-orange-400 hover:underline"
						>
							{isManualUserMode ? '← Cari berdasarkan Nama / Email' : 'Input UUID Manual'}
						</button>
					</div>

					{#if isManualUserMode}
						<input
							type="text"
							bind:value={manualUserId}
							placeholder="Masukkan UUID Pengguna (contoh: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11)"
							class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-mono text-xs"
						/>
					{:else}
						{#if selectedStudent}
							<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
								<div class="flex items-center gap-3">
									<div class="h-8 w-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
										{selectedStudent.name.charAt(0).toUpperCase()}
									</div>
									<div>
										<div class="text-xs font-semibold text-foreground">{selectedStudent.name}</div>
										<div class="text-[11px] text-muted-foreground">{selectedStudent.email}</div>
									</div>
								</div>
								<button
									type="button"
									onclick={() => selectedStudent = null}
									class="text-xs text-zinc-400 hover:text-red-400 transition-colors"
								>
									Ganti
								</button>
							</div>
						{:else}
							<div class="relative">
								<div class="relative">
									<Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
									<input
										type="text"
										bind:value={studentSearchQuery}
										oninput={handleStudentSearchInput}
										placeholder="Ketik nama atau email siswa..."
										class="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
									/>
									{#if isSearchingStudents}
										<Loader2 class="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
									{/if}
								</div>

								{#if searchedStudents.length > 0}
									<div class="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-xl divide-y divide-border">
										{#each searchedStudents as student}
											<button
												type="button"
												onclick={() => selectStudent(student)}
												class="w-full p-2.5 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
											>
												<div>
													<div class="text-xs font-medium text-foreground">{student.name}</div>
													<div class="text-[11px] text-muted-foreground">{student.email}</div>
												</div>
												<span class="text-[10px] text-orange-400 font-medium">Pilih &rarr;</span>
											</button>
										{/each}
									</div>
								{:else if studentSearchQuery.trim() && !isSearchingStudents}
									<div class="absolute z-20 left-0 right-0 mt-1 p-3 bg-card border border-border rounded-lg text-xs text-muted-foreground text-center shadow-lg">
										Tidak ditemukan siswa dengan kata kunci "{studentSearchQuery}".
									</div>
								{/if}
							</div>
						{/if}
					{/if}
				</div>

				<!-- Scope Selection -->
				<div>
					<label for="grant-scope-id" class="block text-xs font-medium text-foreground mb-1">
						Pilih Scope Akses <span class="text-orange-500">*</span>
					</label>
					<select
						id="grant-scope-id"
						bind:value={selectedScopeId}
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
					>
						{#each scopes as scope}
							<option value={scope.id}>
								{scope.name} ({scope.id}) {scope.isActive ? '' : '[Nonaktif]'}
							</option>
						{/each}
					</select>
				</div>

				<!-- Duration Selection -->
				<div>
					<span class="block text-xs font-medium text-foreground mb-1">
						Masa Berlaku Akses <span class="text-orange-500">*</span>
					</span>
					<div class="grid grid-cols-4 gap-2 mb-2">
						{#each [
							{ id: '30', label: '30 Hari' },
							{ id: '90', label: '90 Hari' },
							{ id: '365', label: '1 Tahun' },
							{ id: 'lifetime', label: 'Permanen' }
						] as preset}
							<button
								type="button"
								onclick={() => durationPreset = preset.id as any}
								class="px-2.5 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors {durationPreset === preset.id ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-semibold' : 'border-border bg-background text-muted-foreground hover:bg-muted'}"
							>
								{preset.label}
							</button>
						{/each}
					</div>

					{#if durationPreset === 'custom'}
						<div class="mt-2">
							<label for="custom-date-picker" class="block text-[11px] text-muted-foreground mb-1">
								Pilih Tanggal Kedaluwarsa:
							</label>
							<input
								id="custom-date-picker"
								type="date"
								bind:value={customExpiresAt}
								class="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
							/>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => durationPreset = 'custom'}
							class="text-[11px] text-muted-foreground hover:text-foreground underline"
						>
							Atau pilih tanggal kedaluwarsa kustom...
						</button>
					{/if}
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
					onclick={handleCreateGrant}
					disabled={isSubmittingCreate || (!selectedStudent && !manualUserId)}
					class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50"
				>
					{#if isSubmittingCreate}
						<Loader2 class="h-3.5 w-3.5 animate-spin" />
						Menerbitkan...
					{:else}
						<Check class="h-3.5 w-3.5" />
						Terbitkan Grant
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL: Konfirmasi Pencabutan Akses (Revoke Grant) -->
<!-- ========================================================================= -->
{#if isRevokeModalOpen && grantToRevoke}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
		<div class="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
			<div class="flex items-center gap-3 text-red-400">
				<div class="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
					<Ban class="h-5 w-5" />
				</div>
				<div>
					<h3 class="font-bold text-foreground text-base">Cabut Hak Akses?</h3>
					<p class="text-xs text-muted-foreground">Tindakan ini akan menghentikan akses siswa ke materi terkait.</p>
				</div>
			</div>

			{#if revokeError}
				<div class="rounded-lg p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
					<AlertCircle class="h-4 w-4 shrink-0" />
					<span>{revokeError}</span>
				</div>
			{/if}

			<div class="bg-muted/40 p-3 rounded-lg border border-border space-y-1.5 text-xs">
				<div class="flex justify-between">
					<span class="text-muted-foreground">User ID:</span>
					<span class="font-mono text-foreground">{grantToRevoke.userId}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Scope ID:</span>
					<span class="font-medium text-foreground">{grantToRevoke.scopeId}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Status Saat Ini:</span>
					<span class="text-emerald-400 font-medium capitalize">{grantToRevoke.state}</span>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 border-t border-border pt-3">
				<button
					type="button"
					onclick={() => isRevokeModalOpen = false}
					disabled={isSubmittingRevoke}
					class="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={handleRevokeGrant}
					disabled={isSubmittingRevoke}
					class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
				>
					{#if isSubmittingRevoke}
						<Loader2 class="h-3.5 w-3.5 animate-spin" />
						Mencabut...
					{:else}
						<Ban class="h-3.5 w-3.5" />
						Ya, Cabut Akses
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
