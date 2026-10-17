<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		CheckSquare,
		ChevronRight,
		AlertCircle,
		ShieldAlert,
		ShieldCheck,
		CheckCircle2,
		Clock,
		Search,
		Filter,
		Send,
		RotateCcw,
		Globe,
		Archive,
		Loader2,
		X,
		Check,
		BookOpen,
		ExternalLink,
		UserCheck
	} from 'lucide-svelte';
	import { untrack } from 'svelte';
	import type { AdminContentDto } from '$lib/academyDtos';

	let { data } = $props();

	// Local mutable content list
	let contentItems = $state<AdminContentDto[]>(untrack(() => data.content ?? []));

	// Active tab
	let activeTab = $state<'review' | 'approved' | 'published' | 'draft'>('review');
	let searchQuery = $state('');
	let subjectFilter = $state<string>('all');

	// Current authenticated user permissions
	let user = $derived(data.user);
	let canManage = $derived(
		user?.role === 'super_admin' || user?.permissions?.includes('academy.manage') || false
	);
	let canReview = $derived(
		user?.role === 'super_admin' || user?.permissions?.includes('academy.review') || false
	);
	let canPublish = $derived(
		user?.role === 'super_admin' || user?.permissions?.includes('academy.publish') || false
	);

	// Action Modal States
	type ActionType = 'submit_review' | 'approve' | 'reject' | 'publish' | 'archive';
	let selectedAction = $state<ActionType | null>(null);
	let targetItem = $state<AdminContentDto | null>(null);
	let confirmationChecked = $state(false);
	let actionNote = $state('');
	let isSubmittingAction = $state(false);
	let actionError = $state<string | null>(null);

	// Feedback toast
	let feedbackMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	function showFeedback(type: 'success' | 'error', text: string) {
		feedbackMessage = { type, text };
		setTimeout(() => {
			if (feedbackMessage?.text === text) {
				feedbackMessage = null;
			}
		}, 4000);
	}

	// Filtered counts
	let reviewItems = $derived(contentItems.filter((i) => i.status === 'review'));
	let approvedItems = $derived(contentItems.filter((i) => i.status === 'approved'));
	let publishedItems = $derived(contentItems.filter((i) => i.status === 'published'));
	let draftItems = $derived(contentItems.filter((i) => i.status === 'draft'));

	// Tab-filtered items
	let tabItems = $derived(
		contentItems.filter((i) => {
			if (i.status !== activeTab) return false;
			if (subjectFilter !== 'all' && i.subjectId !== subjectFilter) return false;
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return (
					i.title.toLowerCase().includes(query) ||
					(i.description && i.description.toLowerCase().includes(query)) ||
					(i.instructor && i.instructor.toLowerCase().includes(query)) ||
					i.id.toLowerCase().includes(query)
				);
			}
			return true;
		})
	);

	function openActionModal(action: ActionType, item: AdminContentDto) {
		selectedAction = action;
		targetItem = item;
		confirmationChecked = false;
		actionNote = '';
		actionError = null;
	}

	function closeActionModal() {
		selectedAction = null;
		targetItem = null;
		actionError = null;
	}

	async function handleExecuteAction() {
		if (!targetItem || !selectedAction) return;
		actionError = null;

		let targetStatus: 'draft' | 'review' | 'approved' | 'published' | 'archived';
		let rightsConfirmed = false;

		switch (selectedAction) {
			case 'submit_review':
				targetStatus = 'review';
				break;
			case 'approve':
				if (!confirmationChecked) {
					actionError = 'Wajib mencentang konfirmasi verifikasi kepatuhan materi & syariah.';
					return;
				}
				targetStatus = 'approved';
				rightsConfirmed = true;
				break;
			case 'reject':
				targetStatus = 'draft';
				break;
			case 'publish':
				if (!confirmationChecked) {
					actionError = 'Wajib mengonfirmasi kesiapan rilis materi pembelajaran.';
					return;
				}
				targetStatus = 'published';
				break;
			case 'archive':
				targetStatus = 'archived';
				break;
		}

		isSubmittingAction = true;
		try {
			const res = await fetch(`/api/academy/admin/content/${encodeURIComponent(targetItem.id)}/transition`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					targetStatus,
					rightsConfirmed
				})
			});

			const body = await res.json();
			if (!res.ok) {
				actionError = body.message || 'Gagal mengubah status editorial materi.';
				return;
			}

			// Success: update local item
			contentItems = contentItems.map((c) => (c.id === targetItem?.id ? { ...c, ...body } : c));
			closeActionModal();

			const statusTextMap: Record<string, string> = {
				draft: 'Draf',
				review: 'Menunggu Review',
				approved: 'Disetujui',
				published: 'Dipublikasikan',
				archived: 'Diarsipkan'
			};
			showFeedback('success', `Status materi "${body.title}" berhasil diubah menjadi: ${statusTextMap[body.status] || body.status}.`);
		} catch {
			actionError = 'Terjadi kesalahan jaringan saat memperbarui status editorial.';
		} finally {
			isSubmittingAction = false;
		}
	}
</script>

<svelte:head>
	<title>Editorial & Review Syariah | CryptoSharia Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 text-xs text-muted-foreground mb-1">
				<a href={resolve('/academy/overview')} class="hover:underline">Academy</a>
				<ChevronRight class="h-3 w-3" />
				<span class="text-foreground">Editorial & Review</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
				<CheckSquare class="h-6 w-6 text-orange-500" />
				Antrean Editorial & Review Syariah
			</h1>
			<p class="text-sm text-muted-foreground">
				Workflow editorial formal memisahkan persetujuan kurikulum/syariah (Approve) dengan peluncuran publik (Publish).
			</p>
		</div>

		<!-- Permission Status Pills -->
		<div class="flex items-center gap-2 text-xs">
			<span class="px-2.5 py-1 rounded-md border text-[11px] font-mono {canReview ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}">
				academy.review: {canReview ? 'Aktif' : 'Tidak'}
			</span>
			<span class="px-2.5 py-1 rounded-md border text-[11px] font-mono {canPublish ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}">
				academy.publish: {canPublish ? 'Aktif' : 'Tidak'}
			</span>
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

	<!-- Tabs for Status Queues -->
	<div class="border-b border-border">
		<div class="flex space-x-2 overflow-x-auto">
			<button
				onclick={() => activeTab = 'review'}
				class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap {activeTab === 'review' ? 'border-amber-500 text-amber-400' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				<Clock class="h-4 w-4" />
				Menunggu Review
				<span class="px-1.5 py-0.5 rounded-full text-[10px] {activeTab === 'review' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'bg-muted text-muted-foreground'}">
					{reviewItems.length}
				</span>
			</button>

			<button
				onclick={() => activeTab = 'approved'}
				class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap {activeTab === 'approved' ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				<CheckCircle2 class="h-4 w-4" />
				Disetujui & Siap Rilis
				<span class="px-1.5 py-0.5 rounded-full text-[10px] {activeTab === 'approved' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'bg-muted text-muted-foreground'}">
					{approvedItems.length}
				</span>
			</button>

			<button
				onclick={() => activeTab = 'published'}
				class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap {activeTab === 'published' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				<Globe class="h-4 w-4" />
				Sudah Terbit
				<span class="px-1.5 py-0.5 rounded-full text-[10px] {activeTab === 'published' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-muted text-muted-foreground'}">
					{publishedItems.length}
				</span>
			</button>

			<button
				onclick={() => activeTab = 'draft'}
				class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap {activeTab === 'draft' ? 'border-zinc-500 text-zinc-300' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				<BookOpen class="h-4 w-4" />
				Draf Materi
				<span class="px-1.5 py-0.5 rounded-full text-[10px] {activeTab === 'draft' ? 'bg-zinc-800 text-zinc-300 font-bold' : 'bg-muted text-muted-foreground'}">
					{draftItems.length}
				</span>
			</button>
		</div>
	</div>

	<!-- Controls: Search & Subject Filter -->
	<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
		<div class="relative flex-1 max-w-md">
			<Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Cari materi berdasarkan judul, instruktur, ID..."
				class="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
			/>
		</div>

		<div class="flex items-center gap-2">
			<select
				bind:value={subjectFilter}
				class="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
			>
				<option value="all">Semua Subjek</option>
				<option value="fundamental">Fundamental</option>
				<option value="technical">Technical</option>
				<option value="muamalah">Muamalah</option>
				<option value="web3">Web3</option>
			</select>
		</div>
	</div>

	<!-- Item Cards / Queue List -->
	{#if tabItems.length === 0}
		<div class="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
			{#if activeTab === 'review'}
				Tidak ada materi yang sedang menunggu review.
			{:else if activeTab === 'approved'}
				Tidak ada materi yang sudah disetujui yang menunggu publikasi.
			{:else if activeTab === 'published'}
				Tidak ada materi yang berstatus terbit.
			{:else}
				Tidak ada materi draf.
			{/if}
		</div>
	{:else}
		<div class="space-y-3">
			{#each tabItems as item}
				<div class="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm hover:border-border/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div class="space-y-2 flex-1 min-w-0">
						<!-- Badges Row -->
						<div class="flex flex-wrap items-center gap-2">
							<span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
								{item.subjectId}
							</span>
							<span class="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border">
								Level {item.level} &bull; Bab {item.chapterNumber} &bull; Urutan {item.order}
							</span>
							<span class="px-2 py-0.5 rounded text-[11px] font-mono text-muted-foreground uppercase">
								{item.kind}
							</span>
							{#if item.syariahRequired}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20">
									<ShieldAlert class="h-3 w-3" /> Wajib Review Syariah
								</span>
							{/if}
							{#if item.rightsConfirmed}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
									<ShieldCheck class="h-3 w-3" /> Hak Cipta & Syariah Valid
								</span>
							{/if}
						</div>

						<!-- Title & Description -->
						<div>
							<h3 class="text-base font-bold text-foreground leading-snug">
								{item.title}
							</h3>
							{#if item.description}
								<p class="text-xs text-muted-foreground line-clamp-2 mt-0.5">
									{item.description}
								</p>
							{/if}
						</div>

						<!-- Meta Info -->
						<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
							<span>Instruktur: <strong class="text-foreground">{item.instructor || '-'}</strong></span>
							<span>Durasi: <strong class="text-foreground">{item.durationSeconds ? Math.floor(item.durationSeconds / 60) + ' m' : '-'}</strong></span>
							{#if item.reviewedBy}
								<span>Reviewer: <strong class="text-foreground font-mono">{item.reviewedBy}</strong></span>
							{/if}
							{#if item.approvedAt}
								<span>Disetujui: <strong class="text-foreground">{new Date(item.approvedAt).toLocaleDateString('id-ID')}</strong></span>
							{/if}
							{#if item.publishedAt}
								<span>Terbit: <strong class="text-foreground">{new Date(item.publishedAt).toLocaleDateString('id-ID')}</strong></span>
							{/if}
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex flex-wrap items-center gap-2 shrink-0 md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-border">
						<!-- Link to Content Detail / Tree -->
						<a
							href={resolve('/academy/courses')}
							class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
							title="Buka di Curriculum Tree"
						>
							<ExternalLink class="h-3.5 w-3.5" /> Editor
						</a>

						<!-- Contextual Action Buttons depending on status -->
						{#if item.status === 'review'}
							<!-- Reject / Request Changes -->
							<button
								onclick={() => openActionModal('reject', item)}
								disabled={!canReview}
								class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
								title={canReview ? 'Minta revisi (kembalikan ke Draf)' : 'Memerlukan izin academy.review'}
							>
								<RotateCcw class="h-3.5 w-3.5" /> Minta Revisi
							</button>

							<!-- Approve Review -->
							<button
								onclick={() => openActionModal('approve', item)}
								disabled={!canReview}
								class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none"
								title={canReview ? 'Setujui materi (Approve)' : 'Memerlukan izin academy.review'}
							>
								<Check class="h-3.5 w-3.5" /> Setujui (Approve)
							</button>
						{:else if item.status === 'approved'}
							<!-- Publish -->
							<button
								onclick={() => openActionModal('publish', item)}
								disabled={!canPublish}
								class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none"
								title={canPublish ? 'Publikasikan ke platform belajar siswa' : 'Memerlukan izin academy.publish'}
							>
								<Globe class="h-3.5 w-3.5" /> Terbitkan (Publish)
							</button>

							<!-- Revert to review if needed -->
							<button
								onclick={() => openActionModal('submit_review', item)}
								disabled={!canManage}
								class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
								title="Kembalikan ke antrean review"
							>
								<RotateCcw class="h-3.5 w-3.5" /> Tinjau Ulang
							</button>
						{:else if item.status === 'published'}
							<!-- Archive -->
							<button
								onclick={() => openActionModal('archive', item)}
								disabled={!canPublish}
								class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
								title={canPublish ? 'Arsipkan materi' : 'Memerlukan izin academy.publish'}
							>
								<Archive class="h-3.5 w-3.5" /> Arsipkan
							</button>
						{:else if item.status === 'draft'}
							<!-- Submit for review -->
							<button
								onclick={() => openActionModal('submit_review', item)}
								disabled={!canManage}
								class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none"
								title={canManage ? 'Ajukan materi ke antrean review' : 'Memerlukan izin academy.manage'}
							>
								<Send class="h-3.5 w-3.5" /> Ajukan Review
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- ========================================================================= -->
<!-- MODAL: Workflow Action Modal -->
<!-- ========================================================================= -->
{#if selectedAction && targetItem}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
		<div class="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
			<div class="flex items-center justify-between border-b border-border pb-3">
				<h3 class="font-bold text-foreground text-base flex items-center gap-2">
					{#if selectedAction === 'approve'}
						<CheckCircle2 class="h-5 w-5 text-emerald-500" />
						Persetujuan Editorial & Syariah (Approve)
					{:else if selectedAction === 'publish'}
						<Globe class="h-5 w-5 text-orange-500" />
						Publikasi Materi ke Siswa (Publish)
					{:else if selectedAction === 'reject'}
						<RotateCcw class="h-5 w-5 text-red-500" />
						Minta Revisi Materi
					{:else if selectedAction === 'archive'}
						<Archive class="h-5 w-5 text-zinc-400" />
						Arsipkan Materi
					{:else if selectedAction === 'submit_review'}
						<Send class="h-5 w-5 text-amber-500" />
						Ajukan Materi untuk Review
					{/if}
				</h3>
				<button
					onclick={closeActionModal}
					class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			{#if actionError}
				<div class="rounded-lg p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
					<AlertCircle class="h-4 w-4 shrink-0" />
					<span>{actionError}</span>
				</div>
			{/if}

			<div class="space-y-3 text-xs text-foreground">
				<div class="p-3 bg-muted/40 rounded-lg border border-border space-y-1">
					<div class="font-bold text-sm text-foreground">{targetItem.title}</div>
					<div class="text-muted-foreground">
						Subjek: <span class="uppercase font-semibold">{targetItem.subjectId}</span> &bull; Level {targetItem.level} Bab {targetItem.chapterNumber}
					</div>
				</div>

				{#if selectedAction === 'approve'}
					<div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-2">
						<p class="font-medium">
							Tindakan ini menyetujui materi secara editorial dan menyatakan materi siap diterbitkan oleh penerbit (Publisher).
						</p>
						<p class="text-[11px] text-emerald-300/80">
							Identitas reviewer akan dicatat secara otomatis dari sesi akun yang terautentikasi ({user?.name || user?.email}).
						</p>
					</div>

					<div class="flex items-start gap-2.5 pt-2">
						<input
							id="rights-confirmed-check"
							type="checkbox"
							bind:checked={confirmationChecked}
							class="rounded border-border text-emerald-600 focus:ring-emerald-500 bg-background h-4 w-4 mt-0.5"
						/>
						<label for="rights-confirmed-check" class="text-xs text-foreground cursor-pointer leading-tight">
							Saya mengonfirmasi bahwa materi pembelajaran ini telah diverifikasi bebas dari pelanggaran hak cipta dan memenuhi standar kepatuhan syariah CryptoSharia.
						</label>
					</div>

				{:else if selectedAction === 'publish'}
					<div class="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 space-y-2">
						<p class="font-medium">
							Materi akan langsung dapat diakses oleh siswa terdaftar di CryptoSharia Academy sesuai dengan ketentuan scope.
						</p>
					</div>

					<div class="flex items-start gap-2.5 pt-2">
						<input
							id="publish-confirmed-check"
							type="checkbox"
							bind:checked={confirmationChecked}
							class="rounded border-border text-orange-600 focus:ring-orange-500 bg-background h-4 w-4 mt-0.5"
						/>
						<label for="publish-confirmed-check" class="text-xs text-foreground cursor-pointer leading-tight">
							Saya mengonfirmasi publikasi resmi materi ini ke lingkungan produksi CryptoSharia Academy.
						</label>
					</div>

				{:else if selectedAction === 'reject'}
					<p class="text-muted-foreground">
						Status materi akan dikembalikan ke <strong>Draf</strong> agar instruktur atau pembuat materi dapat melakukan perbaikan.
					</p>

				{:else if selectedAction === 'submit_review'}
					<p class="text-muted-foreground">
						Materi draf akan masuk ke antrean editorial untuk ditinjau oleh Dewan Syariah dan Tim Kurikulum.
					</p>

				{:else if selectedAction === 'archive'}
					<p class="text-muted-foreground">
						Materi yang diarsipkan tidak akan lagi muncul dalam katalog pembelajaran aktif siswa.
					</p>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-2 border-t border-border pt-3">
				<button
					type="button"
					onclick={closeActionModal}
					disabled={isSubmittingAction}
					class="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={handleExecuteAction}
					disabled={isSubmittingAction || ((selectedAction === 'approve' || selectedAction === 'publish') && !confirmationChecked)}
					class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors disabled:opacity-50 {selectedAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : selectedAction === 'publish' ? 'bg-orange-600 hover:bg-orange-500' : selectedAction === 'reject' ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-600 hover:bg-orange-500'}"
				>
					{#if isSubmittingAction}
						<Loader2 class="h-3.5 w-3.5 animate-spin" />
						Memproses...
					{:else}
						Konfirmasi
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
