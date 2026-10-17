<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		BookOpen,
		ChevronRight,
		ChevronDown,
		Plus,
		Search,
		Filter,
		Video,
		CheckCircle,
		Clock,
		AlertTriangle,
		Save,
		Trash2,
		X,
		FileText,
		Layers,
		ShieldCheck,
		ExternalLink,
		Play,
		ArrowLeft,
		Eye,
		AlertCircle,
		Check,
		Sparkles
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { untrack } from 'svelte';
	import type { AdminContentDto, ScopeDto } from '$lib/academyDtos';

	let { data } = $props();

	// Local mutable state
	let contents = $state<AdminContentDto[]>(untrack(() => data.contents || []));
	let scopes = $state<ScopeDto[]>(untrack(() => data.scopes || []));
	let searchQuery = $state('');
	let selectedSubjectFilter = $state(untrack(() => data.filters.subjectId || 'all'));
	let selectedStatusFilter = $state(untrack(() => data.filters.status || 'all'));

	// Selection state
	let selectedItem = $state<AdminContentDto | null>(null);
	let activeTab = $state<'meta' | 'media' | 'markdown'>('meta');
	let mobileView = $state<'tree' | 'editor'>('tree');

	// Tree expand/collapse state
	let expandedNodes = $state<Record<string, boolean>>({
		fundamental: true,
		technical: true,
		muamalah: true,
		web3: true
	});

	// Editor Form State
	let formTitle = $state('');
	let formId = $state('');
	let formDescription = $state('');
	let formScopeId = $state<string | null>(null);
	let formOrder = $state(0);
	let formDurationSeconds = $state(0);
	let formInstructor = $state('');
	let formSyariahRequired = $state(false);

	// Media State (for Lessons)
	let mediaVideoInput = $state('');
	let extractedVideoId = $state('');
	let readingRefs = $state<string[]>([]);
	let attachmentRefs = $state<string[]>([]);
	let newReadingRef = $state('');
	let newAttachmentRef = $state('');

	// Dirty tracking & Loading states
	let isDirty = $state(false);
	let isSaving = $state(false);
	let isTransitioning = $state(false);
	let isDeleting = $state(false);

	// Modal States
	let showCreateModal = $state(false);
	let createKind = $state<'level' | 'chapter' | 'lesson'>('level');
	let createParentId = $state('');
	let createSubjectId = $state('fundamental');
	let createTitle = $state('');
	let createId = $state('');
	let createScopeId = $state<string | null>(null);
	let createDurationSeconds = $state(300);
	let createInstructor = $state('');
	let createSyariahRequired = $state(false);

	// Review & Workflow Modal
	let showReviewModal = $state(false);
	let reviewAction = $state<'approve' | 'reject' | 'publish' | 'archive'>('approve');
	let rightsConfirmed = $state(false);
	let reviewNotes = $state('');
	let shariaAuditRef = $state('');

	// Helper to extract 11-char YouTube ID
	function parseYouTubeId(input: string): string {
		const trimmed = input.trim();
		if (!trimmed) return '';
		if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
		const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
		return match ? match[1] : '';
	}

	$effect(() => {
		extractedVideoId = parseYouTubeId(mediaVideoInput);
	});

	// Select item and load into editor
	function selectContentItem(item: AdminContentDto) {
		if (isDirty) {
			if (!confirm('Ada perubahan yang belum disimpan. Yakin ingin beralih materi?')) {
				return;
			}
		}
		selectedItem = item;
		formTitle = item.title;
		formId = item.id;
		formDescription = item.description || '';
		formScopeId = item.scopeId || null;
		formOrder = item.order;
		formDurationSeconds = item.durationSeconds || 0;
		formInstructor = item.instructor || '';
		formSyariahRequired = Boolean(item.syariahRequired);

		// If lesson, reset media inputs
		mediaVideoInput = '';
		extractedVideoId = '';
		readingRefs = [];
		attachmentRefs = [];

		isDirty = false;
		activeTab = 'meta';
		mobileView = 'editor';

		// Auto-expand parents
		if (item.parentId && item.parentId !== 'root') {
			expandedNodes[item.parentId] = true;
		}
	}

	// Initialize with selectedId from query param if available
	$effect(() => {
		if (data.filters.selectedId && contents.length > 0 && !selectedItem) {
			const found = contents.find((c) => c.id === data.filters.selectedId);
			if (found) selectContentItem(found);
		}
	});

	// Build Tree Structure
	interface TreeNode {
		item: AdminContentDto;
		children: TreeNode[];
	}

	const hierarchicalTree = $derived(() => {
		const subjects = contents.filter((c) => c.kind === 'subject');
		const levels = contents.filter((c) => c.kind === 'level');
		const chapters = contents.filter((c) => c.kind === 'chapter');
		const lessons = contents.filter((c) => c.kind === 'lesson');

		// Filter matching
		const q = searchQuery.toLowerCase().trim();

		return subjects
			.filter((s) => selectedSubjectFilter === 'all' || s.subjectId === selectedSubjectFilter)
			.map((sub) => {
				const subLevels = levels.filter((lvl) => lvl.parentId === sub.id);
				const levelNodes = subLevels.map((lvl) => {
					const lvlChapters = chapters.filter((ch) => ch.parentId === lvl.id);
					const chapterNodes = lvlChapters.map((ch) => {
						const chLessons = lessons.filter((ls) => ls.parentId === ch.id);
						const filteredLessons = chLessons.filter((ls) => {
							const matchesQuery = !q || ls.title.toLowerCase().includes(q) || ls.id.toLowerCase().includes(q);
							const matchesStatus = selectedStatusFilter === 'all' || ls.status === selectedStatusFilter;
							return matchesQuery && matchesStatus;
						});
						return { item: ch, children: filteredLessons.map((ls) => ({ item: ls, children: [] })) };
					});
					return { item: lvl, children: chapterNodes };
				});
				return { item: sub, children: levelNodes };
			});
	});

	function toggleNode(id: string) {
		expandedNodes[id] = !expandedNodes[id];
	}

	function getStatusClass(status: string) {
		switch (status) {
			case 'published':
				return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
			case 'approved':
				return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
			case 'review':
				return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
			case 'archived':
				return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
			default:
				return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
		}
	}

	// Save Content Mutation
	async function handleSave() {
		if (!selectedItem) return;
		isSaving = true;

		try {
			const updatePayload: Record<string, unknown> = {
				title: formTitle.trim(),
				description: formDescription.trim(),
				order: Number(formOrder),
				scopeId: formScopeId || null,
				durationSeconds: Number(formDurationSeconds),
				instructor: formInstructor.trim(),
				syariahRequired: Boolean(formSyariahRequired)
			};

			const res = await fetch(`/api/academy/admin/content/${selectedItem.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatePayload)
			});

			const json = await res.json();
			if (!res.ok) {
				throw new Error(json.message || 'Gagal menyimpan pembaruan materi.');
			}

			// If lesson and video ID was entered, also update media
			if (selectedItem.kind === 'lesson' && extractedVideoId) {
				const mediaRes = await fetch(`/api/academy/admin/content/${selectedItem.id}/media`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						videoId: extractedVideoId,
						readingRefs: readingRefs.filter(Boolean),
						attachmentRefs: attachmentRefs.filter(Boolean)
					})
				});
				const mediaJson = await mediaRes.json();
				if (!mediaRes.ok) {
					throw new Error(mediaJson.message || 'Materi tersimpan, namun konfigurasi video gagal.');
				}
			}

			// Update in local state
			const idx = contents.findIndex((c) => c.id === selectedItem?.id);
			if (idx !== -1) {
				contents[idx] = { ...contents[idx], ...json };
				selectedItem = contents[idx];
			}

			isDirty = false;
			toast.success('Materi kurikulum berhasil disimpan');
		} catch (err: any) {
			toast.error(err.message || 'Terjadi kesalahan saat menyimpan materi');
		} finally {
			isSaving = false;
		}
	}

	// Status Transition Execution
	async function executeTransition(targetStatus: string, confirmed = false) {
		if (!selectedItem) return;
		isTransitioning = true;

		try {
			const res = await fetch(`/api/academy/admin/content/${selectedItem.id}/transition`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					targetStatus,
					rightsConfirmed: confirmed
				})
			});

			const json = await res.json();
			if (!res.ok) {
				throw new Error(json.message || `Gagal mengubah status materi ke ${targetStatus}`);
			}

			// Update local item
			const idx = contents.findIndex((c) => c.id === selectedItem?.id);
			if (idx !== -1) {
				contents[idx] = { ...contents[idx], ...json };
				selectedItem = contents[idx];
			}

			showReviewModal = false;
			toast.success(`Status materi berhasil diubah menjadi "${targetStatus}"`);
		} catch (err: any) {
			toast.error(err.message || 'Gagal mengeksekusi transisi status');
		} finally {
			isTransitioning = false;
		}
	}

	// Delete Draft Content
	async function handleDeleteDraft() {
		if (!selectedItem || selectedItem.status !== 'draft') return;
		if (!confirm(`Hapus draf "${selectedItem.title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
			return;
		}

		isDeleting = true;
		try {
			const res = await fetch(`/api/academy/admin/content/${selectedItem.id}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				throw new Error(json.message || 'Gagal menghapus draf materi');
			}

			contents = contents.filter((c) => c.id !== selectedItem?.id);
			selectedItem = null;
			isDirty = false;
			mobileView = 'tree';
			toast.success('Draf materi berhasil dihapus');
		} catch (err: any) {
			toast.error(err.message || 'Terjadi kesalahan saat menghapus draf');
		} finally {
			isDeleting = false;
		}
	}

	// Create New Entity
	function openCreateModal(kind: 'level' | 'chapter' | 'lesson', parent: AdminContentDto) {
		createKind = kind;
		createParentId = parent.id;
		createSubjectId = parent.subjectId;
		createTitle = '';
		createId = '';
		createScopeId = parent.scopeId || null;
		createDurationSeconds = 300;
		createInstructor = parent.instructor || '';
		createSyariahRequired = false;
		showCreateModal = true;
	}

	async function handleCreateEntity() {
		if (!createTitle.trim() || !createId.trim()) {
			toast.error('Judul dan ID/Slug wajib diisi');
			return;
		}

		try {
			// Compute next order
			const siblings = contents.filter((c) => c.parentId === createParentId);
			const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order)) + 1 : 0;

			// Determine level & chapterNumber from parent
			let lvl = 1;
			let chNum = 1;
			const parent = contents.find((c) => c.id === createParentId);
			if (parent) {
				lvl = parent.level || 1;
				chNum = parent.chapterNumber || 1;
			}
			if (createKind === 'level') {
				lvl = (siblings.length || 0) + 1;
			} else if (createKind === 'chapter') {
				chNum = (siblings.length || 0) + 1;
			}

			const payload = {
				id: createId.trim().toLowerCase(),
				kind: createKind,
				parentId: createParentId,
				subjectId: createSubjectId,
				level: lvl,
				chapterNumber: chNum,
				order: nextOrder,
				scopeId: createScopeId || null,
				title: createTitle.trim(),
				description: '',
				durationSeconds: createKind === 'lesson' ? Number(createDurationSeconds) : 0,
				instructor: createInstructor.trim(),
				syariahRequired: Boolean(createSyariahRequired)
			};

			const res = await fetch('/api/academy/admin/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const json = await res.json();
			if (!res.ok) {
				throw new Error(json.message || 'Gagal menambahkan entitas kurikulum baru');
			}

			contents = [...contents, json];
			expandedNodes[createParentId] = true;
			selectContentItem(json);
			showCreateModal = false;
			toast.success(`Berhasil menambahkan ${createKind} baru: "${json.title}"`);
		} catch (err: any) {
			toast.error(err.message || 'Terjadi kesalahan saat membuat entitas');
		}
	}
</script>

<svelte:head>
	<title>Curriculum Tree Builder & Editor | CryptoSharia Admin</title>
</svelte:head>

<div class="space-y-4">
	<!-- Top Navigation & Controls Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
		<div>
			<div class="flex items-center gap-2 text-xs text-muted-foreground mb-1">
				<a href={resolve('/dashboard')} class="hover:underline">Dashboard</a>
				<ChevronRight class="h-3 w-3" />
				<a href={resolve('/academy/overview')} class="hover:underline">Academy</a>
				<ChevronRight class="h-3 w-3" />
				<span class="text-foreground font-medium">Curriculum Builder</span>
			</div>
			<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
				<BookOpen class="h-5 w-5 text-orange-500" />
				Pohon Kurikulum & Editor Materi
			</h1>
		</div>

		<!-- Mobile view toggle -->
		<div class="flex items-center gap-2 md:hidden">
			<div class="inline-flex rounded-lg border border-border bg-card p-1">
				<button
					onclick={() => (mobileView = 'tree')}
					class="px-3 py-1 text-xs font-semibold rounded-md transition-colors {mobileView === 'tree' ? 'bg-orange-500 text-white' : 'text-muted-foreground'}"
				>
					Pohon Kurikulum
				</button>
				<button
					onclick={() => (mobileView = 'editor')}
					class="px-3 py-1 text-xs font-semibold rounded-md transition-colors {mobileView === 'editor' ? 'bg-orange-500 text-white' : 'text-muted-foreground'}"
				>
					Editor Materi
				</button>
			</div>
		</div>
	</div>

	<!-- Main Workspace Split-Grid -->
	<div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
		<!-- Left Panel: Curriculum Tree Browser (5 cols) -->
		<div class="md:col-span-5 space-y-3 {mobileView === 'editor' ? 'hidden md:block' : 'block'}">
			<!-- Filters & Search Toolbar -->
			<div class="rounded-xl border border-border bg-card p-3 space-y-2.5 shadow-sm">
				<!-- Search -->
				<div class="relative">
					<Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Cari materi, bab, level..."
						class="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
					/>
				</div>

				<!-- Subject Tabs -->
				<div class="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
					{#each [
						{ id: 'all', label: 'Semua' },
						{ id: 'fundamental', label: 'Fundamental' },
						{ id: 'technical', label: 'Technical' },
						{ id: 'muamalah', label: 'Muamalah' },
						{ id: 'web3', label: 'Web3' }
					] as tab}
						<button
							onclick={() => (selectedSubjectFilter = tab.id)}
							class="whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors {selectedSubjectFilter === tab.id ? 'bg-orange-500 text-white font-semibold' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}"
						>
							{tab.label}
						</button>
					{/each}
				</div>

				<!-- Status Filter -->
				<div class="flex items-center justify-between text-xs pt-1 border-t border-border/50">
					<span class="text-[11px] text-muted-foreground">Status filter:</span>
					<select
						bind:value={selectedStatusFilter}
						class="rounded border border-border bg-background px-2 py-0.5 text-[11px] text-foreground focus:border-orange-500 focus:outline-none"
					>
						<option value="all">Semua Status</option>
						<option value="draft">Draft</option>
						<option value="review">Review</option>
						<option value="approved">Approved</option>
						<option value="published">Published</option>
						<option value="archived">Archived</option>
					</select>
				</div>
			</div>

			<!-- Hierarchical Tree Container -->
			<div class="rounded-xl border border-border bg-card p-3 shadow-sm min-h-[500px] max-h-[720px] overflow-y-auto custom-scrollbar">
				{#if hierarchicalTree().length === 0}
					<div class="p-8 text-center text-xs text-muted-foreground space-y-2">
						<BookOpen class="h-8 w-8 mx-auto opacity-30" />
						<p>Tidak ada materi kurikulum yang cocok dengan filter pencarian.</p>
					</div>
				{:else}
					<div class="space-y-2 select-none text-xs">
						{#each hierarchicalTree() as subjectNode}
							<!-- 1. Subject Node -->
							<div class="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
								<div class="flex items-center justify-between p-2 bg-muted/40 hover:bg-muted/60 transition-colors">
									<button
										onclick={() => toggleNode(subjectNode.item.id)}
										class="flex items-center gap-1.5 font-bold text-foreground truncate text-left flex-1"
									>
										{#if expandedNodes[subjectNode.item.id]}
											<ChevronDown class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
										{:else}
											<ChevronRight class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
										{/if}
										<span class="truncate uppercase text-orange-500">{subjectNode.item.title}</span>
									</button>
									<button
										onclick={() => openCreateModal('level', subjectNode.item)}
										title="Tambah Level baru"
										class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors shrink-0"
									>
										<Plus class="h-3 w-3" /> Level
									</button>
								</div>

								<!-- 2. Levels Children -->
								{#if expandedNodes[subjectNode.item.id]}
									<div class="p-1 pl-3 space-y-1.5 border-t border-border/40">
										{#each subjectNode.children as levelNode}
											<div class="rounded-md border border-border/40 bg-card overflow-hidden">
												<div class="flex items-center justify-between p-1.5 hover:bg-muted/30 transition-colors">
													<button
														onclick={() => toggleNode(levelNode.item.id)}
														class="flex items-center gap-1 font-semibold text-foreground truncate text-left flex-1"
													>
														{#if expandedNodes[levelNode.item.id]}
															<ChevronDown class="h-3 w-3 shrink-0 text-muted-foreground" />
														{:else}
															<ChevronRight class="h-3 w-3 shrink-0 text-muted-foreground" />
														{/if}
														<span class="truncate text-[11px]">{levelNode.item.title}</span>
													</button>
													<button
														onclick={() => openCreateModal('chapter', levelNode.item)}
														title="Tambah Bab (Chapter) baru"
														class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors shrink-0"
													>
														<Plus class="h-3 w-3" /> Bab
													</button>
												</div>

												<!-- 3. Chapters Children -->
												{#if expandedNodes[levelNode.item.id]}
													<div class="p-1 pl-3 space-y-1 border-t border-border/30">
														{#each levelNode.children as chapterNode}
															<div class="rounded border border-border/30 bg-muted/10 overflow-hidden">
																<div class="flex items-center justify-between p-1.5 hover:bg-muted/40 transition-colors">
																	<button
																		onclick={() => toggleNode(chapterNode.item.id)}
																		class="flex items-center gap-1 font-medium text-foreground truncate text-left flex-1"
																	>
																		{#if expandedNodes[chapterNode.item.id]}
																			<ChevronDown class="h-3 w-3 shrink-0 text-muted-foreground" />
																		{:else}
																			<ChevronRight class="h-3 w-3 shrink-0 text-muted-foreground" />
																		{/if}
																		<span class="truncate text-[11px]">{chapterNode.item.title}</span>
																	</button>
																	<button
																		onclick={() => openCreateModal('lesson', chapterNode.item)}
																		title="Tambah Pelajaran (Lesson) baru"
																		class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors shrink-0"
																	>
																		<Plus class="h-3 w-3" /> Pelajaran
																	</button>
																</div>

																<!-- 4. Lessons Leaf Nodes -->
																{#if expandedNodes[chapterNode.item.id]}
																	<div class="p-1 pl-3 space-y-1 border-t border-border/20">
																		{#each chapterNode.children as lessonNode}
																			{@const isSelected = selectedItem?.id === lessonNode.item.id}
																			<button
																				onclick={() => selectContentItem(lessonNode.item)}
																				class="w-full flex items-center justify-between gap-2 p-1.5 rounded text-left transition-colors {isSelected ? 'bg-orange-500/15 border border-orange-500/40 text-foreground font-semibold' : 'hover:bg-muted/50 text-muted-foreground'}"
																			>
																				<div class="flex items-center gap-1.5 min-w-0">
																					<Video class="h-3.5 w-3.5 shrink-0 {isSelected ? 'text-orange-500' : 'text-muted-foreground'}" />
																					<span class="truncate text-[11px]">{lessonNode.item.title}</span>
																				</div>
																				<div class="flex items-center gap-1.5 shrink-0">
																					{#if lessonNode.item.durationSeconds}
																						<span class="text-[10px] text-muted-foreground">
																							{Math.floor(lessonNode.item.durationSeconds / 60)}m
																						</span>
																					{/if}
																					<span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border {getStatusClass(lessonNode.item.status)}">
																						{lessonNode.item.status}
																					</span>
																				</div>
																			</button>
																		{/each}
																	</div>
																{/if}
															</div>
														{/each}
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Panel: Content Workspace Editor (7 cols) -->
		<div class="md:col-span-7 space-y-3 {mobileView === 'tree' ? 'hidden md:block' : 'block'}">
			{#if !selectedItem}
				<!-- Empty Selection Guide State -->
				<div class="rounded-xl border border-dashed border-border bg-card p-8 sm:p-12 text-center text-muted-foreground space-y-4">
					<div class="h-12 w-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
						<BookOpen class="h-6 w-6" />
					</div>
					<div>
						<h3 class="text-base font-bold text-foreground">Pilih Materi untuk Mulai Mengedit</h3>
						<p class="text-xs text-muted-foreground max-w-md mx-auto mt-1">
							Pilih materi dari pohon kurikulum di sebelah kiri untuk mengubah judul, deskripsi, durasi, video YouTube, dan menjalankan alur review syariah.
						</p>
					</div>
				</div>
			{:else}
				<!-- Workspace Editor Panel -->
				<div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
					<!-- Editor Top Bar: Breadcrumb & Status & Actions -->
					<div class="p-3.5 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
						<div class="space-y-0.5 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-xs font-mono text-muted-foreground">ID: {selectedItem.id}</span>
								<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border {getStatusClass(selectedItem.status)}">
									{selectedItem.status}
								</span>
								{#if selectedItem.version}
									<span class="text-[10px] text-muted-foreground font-mono">v{selectedItem.version}</span>
								{/if}
							</div>
							<h2 class="text-sm sm:text-base font-bold text-foreground truncate">
								{formTitle || selectedItem.title}
							</h2>
						</div>

						<!-- Action Controls -->
						<div class="flex items-center gap-2">
							<!-- Context-aware workflow button -->
							{#if selectedItem.status === 'draft'}
								<button
									onclick={() => executeTransition('review')}
									disabled={isTransitioning}
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors"
								>
									<Clock class="h-3.5 w-3.5" />
									Ajukan Review
								</button>
							{:else if selectedItem.status === 'review'}
								<button
									onclick={() => {
										reviewAction = 'approve';
										showReviewModal = true;
									}}
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-colors"
								>
									<CheckCircle class="h-3.5 w-3.5" />
									Verifikasi Review
								</button>
							{:else if selectedItem.status === 'approved'}
								<button
									onclick={() => {
										reviewAction = 'publish';
										showReviewModal = true;
									}}
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors"
								>
									<Sparkles class="h-3.5 w-3.5" />
									Publikasikan
								</button>
							{:else if selectedItem.status === 'published'}
								<button
									onclick={() => {
										reviewAction = 'archive';
										showReviewModal = true;
									}}
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
								>
									Arsipkan
								</button>
							{/if}

							<!-- Delete draft button -->
							{#if selectedItem.status === 'draft'}
								<button
									onclick={handleDeleteDraft}
									disabled={isDeleting}
									title="Hapus draf ini"
									class="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
									aria-label="Hapus draf"
								>
									<Trash2 class="h-4 w-4" />
								</button>
							{/if}
						</div>
					</div>

					<!-- Navigation Tabs inside Editor -->
					<div class="flex items-center border-b border-border px-4 bg-card text-xs">
						<button
							onclick={() => (activeTab = 'meta')}
							class="py-2.5 px-3 font-semibold border-b-2 transition-colors {activeTab === 'meta' ? 'border-orange-500 text-orange-500' : 'border-transparent text-muted-foreground hover:text-foreground'}"
						>
							Metadata & Konten
						</button>
						{#if selectedItem.kind === 'lesson'}
							<button
								onclick={() => (activeTab = 'media')}
								class="py-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 {activeTab === 'media' ? 'border-orange-500 text-orange-500' : 'border-transparent text-muted-foreground hover:text-foreground'}"
							>
								<Video class="h-3.5 w-3.5" />
								Media Video YouTube
							</button>
						{/if}
					</div>

					<!-- Tab Content Body -->
					<div class="p-4 sm:p-5 space-y-4">
						{#if activeTab === 'meta'}
							<!-- 1. Metadata Tab -->
							<div class="space-y-4 text-xs">
								<!-- Title -->
								<div class="space-y-1">
									<label for="form-title" class="font-semibold text-foreground">Judul Materi *</label>
									<input
										id="form-title"
										type="text"
										bind:value={formTitle}
										oninput={() => (isDirty = true)}
										class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
									/>
								</div>

								<!-- Description / Summary -->
								<div class="space-y-1">
									<label for="form-desc" class="font-semibold text-foreground">Ringkasan Materi Pelajaran</label>
									<textarea
										id="form-desc"
										rows="4"
										bind:value={formDescription}
										oninput={() => (isDirty = true)}
										placeholder="Uraikan ringkasan materi, poin bahasan, dan tujuan pembelajaran..."
										class="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
									></textarea>
								</div>

								<!-- Scope & Duration Grid -->
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<!-- Scope Selection -->
									<div class="space-y-1">
										<label for="form-scope" class="font-semibold text-foreground">Scope Akses Pelajaran</label>
										<select
											id="form-scope"
											bind:value={formScopeId}
											onchange={() => (isDirty = true)}
											class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
										>
											<option value={null}>Tanpa Batasan Scope (Terbuka)</option>
											{#each scopes as sc}
												<option value={sc.id}>{sc.name} ({sc.id})</option>
											{/each}
										</select>
									</div>

									<!-- Duration Seconds -->
									{#if selectedItem.kind === 'lesson'}
										<div class="space-y-1">
											<label for="form-duration" class="font-semibold text-foreground">Durasi Video (Detik)</label>
											<div class="flex items-center gap-2">
												<input
													id="form-duration"
													type="number"
													min="0"
													bind:value={formDurationSeconds}
													oninput={() => (isDirty = true)}
													class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
												/>
												<span class="text-[11px] text-muted-foreground whitespace-nowrap">
													~ {Math.floor(formDurationSeconds / 60)}m {formDurationSeconds % 60}s
												</span>
											</div>
										</div>
									{/if}
								</div>

								<!-- Instructor & Order Grid -->
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div class="space-y-1">
										<label for="form-instructor" class="font-semibold text-foreground">Nama Pengajar / Instruktur</label>
										<input
											id="form-instructor"
											type="text"
											bind:value={formInstructor}
											oninput={() => (isDirty = true)}
											placeholder="cth: Ust. Dr. Erwandi Tarmizi"
											class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
										/>
									</div>

									<div class="space-y-1">
										<label for="form-order" class="font-semibold text-foreground">Urutan Tampil (Order Number)</label>
										<input
											id="form-order"
											type="number"
											min="0"
											bind:value={formOrder}
											oninput={() => (isDirty = true)}
											class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
										/>
									</div>
								</div>

								<!-- Syariah Toggle -->
								<div class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
									<div class="space-y-0.5">
										<span class="font-semibold text-foreground">Wajib Review Kepatuhan Syariah</span>
										<p class="text-[11px] text-muted-foreground">
											Materi ini menyangkut hukum fikih, akad kripto, atau fatwa syariah yang memerlukan penelaahan auditor.
										</p>
									</div>
									<input
										type="checkbox"
										bind:checked={formSyariahRequired}
										onchange={() => (isDirty = true)}
										class="h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
									/>
								</div>
							</div>
						{:else if activeTab === 'media'}
							<!-- 2. YouTube Media Tab -->
							<div class="space-y-4 text-xs">
								<div class="space-y-1.5">
									<label for="media-input" class="font-semibold text-foreground">Tautan Video YouTube atau 11-Karakter Video ID</label>
									<div class="flex items-center gap-2">
										<input
											id="media-input"
											type="text"
											bind:value={mediaVideoInput}
											oninput={() => (isDirty = true)}
											placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ atau dQw4w9WgXcQ"
											class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
										/>
									</div>
									{#if extractedVideoId}
										<p class="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
											<Check class="h-3 w-3" /> Video ID terdeteksi: <code class="font-mono bg-muted px-1 rounded">{extractedVideoId}</code>
										</p>
									{:else if mediaVideoInput}
										<p class="text-[11px] text-amber-500 font-medium flex items-center gap-1">
											<AlertCircle class="h-3 w-3" /> Format link belum valid (harus mengandung 11 karakter YouTube ID).
										</p>
									{/if}
								</div>

								<!-- 16:9 Video Player Preview -->
								<div class="rounded-xl border border-border bg-black/90 overflow-hidden aspect-video flex items-center justify-center relative">
									{#if extractedVideoId}
										<iframe
											src="https://www.youtube-nocookie.com/embed/{extractedVideoId}"
											title="YouTube video player"
											class="w-full h-full border-0"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											allowfullscreen
										></iframe>
									{:else}
										<div class="text-center p-6 text-muted-foreground space-y-2">
											<Play class="h-10 w-10 mx-auto text-muted-foreground/40" />
											<p class="text-xs">Masukkan tautan YouTube di atas untuk melihat preview materi video.</p>
										</div>
									{/if}
								</div>

								<!-- Extra Reading References -->
								<div class="space-y-2 pt-2">
									<span class="block font-semibold text-foreground">Tautan Referensi Bacaan & Dalil (Opsional)</span>
									<div class="space-y-1.5">
										{#each readingRefs as ref, idx}
											<div class="flex items-center gap-2">
												<input
													type="text"
													value={ref}
													oninput={(e) => {
														readingRefs[idx] = (e.target as HTMLInputElement).value;
														isDirty = true;
													}}
													class="w-full rounded border border-border bg-background px-2.5 py-1 text-xs"
												/>
												<button
													onclick={() => {
														readingRefs = readingRefs.filter((_, i) => i !== idx);
														isDirty = true;
													}}
													class="p-1 text-red-500 hover:bg-red-500/10 rounded"
												>
													<X class="h-3.5 w-3.5" />
												</button>
											</div>
										{/each}
										<div class="flex items-center gap-2">
											<input
												type="text"
												bind:value={newReadingRef}
												placeholder="https://cryptosharia.id/fatwa/..."
												class="w-full rounded border border-border bg-background px-2.5 py-1 text-xs"
											/>
											<button
												onclick={() => {
													if (newReadingRef.trim()) {
														readingRefs = [...readingRefs, newReadingRef.trim()];
														newReadingRef = '';
														isDirty = true;
													}
												}}
												class="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold whitespace-nowrap"
											>
												+ Tambah
											</button>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Bottom Sticky Save Bar -->
					<div class="p-3.5 border-t border-border bg-card flex items-center justify-between gap-3">
						<div class="text-xs">
							{#if isDirty}
								<span class="text-amber-500 font-semibold flex items-center gap-1.5 animate-pulse">
									<AlertCircle class="h-3.5 w-3.5" /> Ada perubahan yang belum disimpan
								</span>
							{:else}
								<span class="text-muted-foreground flex items-center gap-1">
									<Check class="h-3.5 w-3.5 text-emerald-500" /> Tersinkronisasi dengan server
								</span>
							{/if}
						</div>

						<button
							onclick={handleSave}
							disabled={isSaving}
							class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow transition-all disabled:opacity-50"
						>
							<Save class="h-4 w-4" />
							{isSaving ? 'Menyimpan...' : 'Simpan Materi'}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- CREATE ENTITY MODAL -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl space-y-4">
			<div class="flex items-center justify-between border-b border-border pb-3">
				<h3 class="text-sm font-bold text-foreground">
					Tambah {createKind.toUpperCase()} Baru
				</h3>
				<button onclick={() => (showCreateModal = false)} class="p-1 text-muted-foreground hover:text-foreground">
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="space-y-3 text-xs">
				<div class="space-y-1">
					<label for="create-title" class="font-semibold text-foreground">Judul {createKind} *</label>
					<input
						id="create-title"
						type="text"
						bind:value={createTitle}
						oninput={() => {
							// Auto-generate clean slug
							createId = `${createParentId}-${createTitle
								.toLowerCase()
								.replace(/[^a-z0-9]+/g, '-')
								.replace(/^-|-$/g, '')}`;
						}}
						placeholder="cth: Pelajaran 1: Definisi Maal"
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
					/>
				</div>

				<div class="space-y-1">
					<label for="create-id" class="font-semibold text-foreground">ID / Slug * (Huruf kecil, angka, tanda hubung)</label>
					<input
						id="create-id"
						type="text"
						bind:value={createId}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-orange-500 focus:outline-none"
					/>
				</div>

				{#if createKind === 'lesson'}
					<div class="space-y-1">
						<label for="create-scope" class="font-semibold text-foreground">Scope Pembelajaran</label>
						<select
							id="create-scope"
							bind:value={createScopeId}
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						>
							<option value={null}>Bebas / Tanpa Scope Khusus</option>
							{#each scopes as sc}
								<option value={sc.id}>{sc.name}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-1">
						<label for="create-instructor" class="font-semibold text-foreground">Nama Pengajar</label>
						<input
							id="create-instructor"
							type="text"
							bind:value={createInstructor}
							placeholder="cth: Tim Syariah CryptoSharia"
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						/>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
				<button
					onclick={() => (showCreateModal = false)}
					class="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-muted/40 hover:bg-muted text-foreground"
				>
					Batal
				</button>
				<button
					onclick={handleCreateEntity}
					class="px-4 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow"
				>
					Tambahkan
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- REVIEW & WORKFLOW MODAL -->
{#if showReviewModal && selectedItem}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
		<div class="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
			<div class="flex items-center justify-between border-b border-border pb-3">
				<div>
					<h3 class="text-sm font-bold text-foreground flex items-center gap-2">
						{#if reviewAction === 'approve'}
							<CheckCircle class="h-4 w-4 text-blue-500" />
							Persetujuan Review Editorial & Syariah
						{:else if reviewAction === 'publish'}
							<Sparkles class="h-4 w-4 text-emerald-500" />
							Konfirmasi Publikasi Materi ke Siswa
						{:else if reviewAction === 'reject'}
							<AlertTriangle class="h-4 w-4 text-amber-500" />
							Kembalikan Materi ke Draf Revisi
						{:else}
							Arsipkan Materi
						{/if}
					</h3>
					<p class="text-xs text-muted-foreground mt-0.5">{selectedItem.title}</p>
				</div>
				<button onclick={() => (showReviewModal = false)} class="p-1 text-muted-foreground hover:text-foreground">
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="space-y-3.5 text-xs">
				<!-- Reviewer Attribution -->
				<div class="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
					<span class="text-muted-foreground block text-[11px]">Peninjau / Reviewer:</span>
					<span class="font-bold text-foreground">{data.user?.name ?? 'Admin'} ({data.user?.email ?? 'admin@cryptosharia.id'})</span>
					<span class="text-[10px] text-muted-foreground block">Otorisasi tervalidasi melalui sesi login aktif.</span>
				</div>

				{#if reviewAction === 'approve'}
					<!-- Confirmation checkbox -->
					<div class="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-2">
						<label class="flex items-start gap-2.5 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={rightsConfirmed}
								class="h-4 w-4 rounded border-border text-blue-500 focus:ring-blue-500 mt-0.5"
							/>
							<span class="text-foreground leading-relaxed">
								Saya menyatakan bahwa materi ini telah diverifikasi memenuhi prinsip syariah, terbebas dari hak cipta pihak ketiga tanpa izin, dan akurat secara pedagogis.
							</span>
						</label>
						<p class="text-[10px] text-muted-foreground pl-6">
							* Catatan: Konfirmasi ini adalah verifikasi administratif awal dan dicatat dalam audit log database.
						</p>
					</div>

					<div class="space-y-1">
						<label for="courses-sharia-audit-ref" class="font-semibold text-foreground">Referensi Fatwa / Catatan Dewan Syariah (Opsional)</label>
						<input
							id="courses-sharia-audit-ref"
							type="text"
							bind:value={shariaAuditRef}
							placeholder="cth: Fatwa DSN-MUI No. 116 / Review Dewan Syariah CS-2026"
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-blue-500 focus:outline-none"
						/>
					</div>
				{:else if reviewAction === 'publish'}
					<div class="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-foreground space-y-1.5">
						<p class="font-semibold text-emerald-500">Materi akan langsung dapat diakses oleh siswa.</p>
						<p class="text-muted-foreground text-[11px] leading-relaxed">
							Nomor versi materi akan dinaikkan menjadi <strong>v{(selectedItem.version || 0) + 1}</strong>. Siswa yang memiliki hak akses (grant) pada scope terkait dapat langsung memutar video dan mencatat progres belajar.
						</p>
					</div>
				{:else if reviewAction === 'reject'}
					<div class="space-y-1">
						<label for="courses-review-notes" class="font-semibold text-foreground">Catatan Perbaikan / Alasan Penolakan</label>
						<textarea
							id="courses-review-notes"
							rows="3"
							bind:value={reviewNotes}
							placeholder="Tuliskan catatan perbaikan atau referensi yang perlu dikoreksi oleh penyusun kurikulum..."
							class="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:border-amber-500 focus:outline-none"
						></textarea>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
				<button
					onclick={() => (showReviewModal = false)}
					class="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-muted/40 hover:bg-muted text-foreground"
				>
					Batal
				</button>

				{#if reviewAction === 'approve'}
					<button
						onclick={() => executeTransition('approved', rightsConfirmed)}
						disabled={!rightsConfirmed || isTransitioning}
						class="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white shadow disabled:opacity-40 transition-all"
					>
						{isTransitioning ? 'Menyetujui...' : 'Setujui Review'}
					</button>
				{:else if reviewAction === 'publish'}
					<button
						onclick={() => executeTransition('published', true)}
						disabled={isTransitioning}
						class="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow disabled:opacity-40 transition-all"
					>
						{isTransitioning ? 'Memublikasikan...' : 'Rilis Publikasi'}
					</button>
				{:else if reviewAction === 'reject'}
					<button
						onclick={() => executeTransition('draft', false)}
						disabled={isTransitioning}
						class="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow disabled:opacity-40 transition-all"
					>
						{isTransitioning ? 'Mengembalikan...' : 'Kembalikan ke Draf'}
					</button>
				{:else if reviewAction === 'archive'}
					<button
						onclick={() => executeTransition('archived', false)}
						disabled={isTransitioning}
						class="px-4 py-1.5 rounded-lg text-xs font-bold bg-zinc-600 hover:bg-zinc-700 text-white shadow transition-all"
					>
						Arsipkan Materi
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
