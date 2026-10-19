<script lang="ts">
	import { resolve } from '$app/paths';
	import { replaceState } from '$app/navigation';
	import {
		BookOpen,
		ChevronRight,
		ChevronDown,
		Plus,
		Search,
		Video,
		CheckCircle,
		Clock,
		AlertTriangle,
		Save,
		Trash2,
		X,
		Play,
		AlertCircle,
		Check,
		Sparkles,
		Loader2
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

	// Dirty tracking & Loading states
	let isDirty = $state(false);
	let isSaving = $state(false);
	let isTransitioning = $state(false);
	let isDeleting = $state(false);

	// Modal States & Guided Creation
	const SUBJECT_METADATA: Record<string, { title: string; desc: string }> = {
		fundamental: {
			title: 'Analisis Fundamental',
			desc: 'Konsep dasar, tokenomics, utilitas, dan evaluasi nilai intrinsik aset kripto.'
		},
		technical: {
			title: 'Analisis Teknikal',
			desc: 'Analisis grafik harga, indikator teknikal, tren pasar, dan manajemen risiko.'
		},
		muamalah: {
			title: 'Fikih & Muamalah Aset Kripto',
			desc: 'Kajian fikih muamalah Islam, prinsip halal-haram, gharar, maysir, dan kepatuhan syariah pada aset kripto.'
		},
		web3: {
			title: 'Web3 & Ekosistem Blockchain',
			desc: 'Teknologi blockchain, smart contracts, dompet kripto, DeFi, dan ekosistem terdesentralisasi.'
		}
	};

	let showCreateModal = $state(false);
	let isDirectFromNode = $state(false);
	let createKind = $state<'subject' | 'level' | 'chapter' | 'lesson'>('subject');
	let createParentId = $state('root');
	let createSubjectId = $state<'fundamental' | 'technical' | 'muamalah' | 'web3'>('fundamental');
	let createTitle = $state('');
	let createId = $state('');
	let createDescription = $state('');
	let createScopeId = $state<string | null>(null);
	let createDurationMinutes = $state(15);
	let createInstructor = $state('Tim Edukasi CryptoSharia');
	let createSyariahRequired = $state(false);
	let isCreating = $state(false);
	let createError = $state<string | null>(null);

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

	let hasHandledCreateAction = false;

	// Handle ?create=true quick action from dashboard
	$effect(() => {
		if (data.filters.createAction && data.permissions.canManage && !hasHandledCreateAction) {
			hasHandledCreateAction = true;
			openCreateModalRoot();
			if (typeof window !== 'undefined') {
				const cleanUrl = new URL(window.location.href);
				cleanUrl.searchParams.delete('create');
				replaceState(`${resolve('/academy/courses')}${cleanUrl.search}`, {});
			}
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
				const levelNodes = subLevels
					.map((lvl) => {
						const lvlChapters = chapters.filter((ch) => ch.parentId === lvl.id);
						const chapterNodes = lvlChapters
							.map((ch) => {
								const chLessons = lessons.filter((ls) => ls.parentId === ch.id);
								const filteredLessons = chLessons.filter((ls) => {
									const matchesQuery = !q || ls.title.toLowerCase().includes(q) || ls.id.toLowerCase().includes(q);
									const matchesStatus = selectedStatusFilter === 'all' || ls.status === selectedStatusFilter;
									return matchesQuery && matchesStatus;
								});
								const chMatches = !q || ch.title.toLowerCase().includes(q) || ch.id.toLowerCase().includes(q);
								const chStatusMatches = selectedStatusFilter === 'all' || ch.status === selectedStatusFilter;
								if (!q && selectedStatusFilter === 'all') {
									return { item: ch, children: filteredLessons.map((ls) => ({ item: ls, children: [] })) };
								}
								if ((chMatches && chStatusMatches) || filteredLessons.length > 0) {
									return { item: ch, children: filteredLessons.map((ls) => ({ item: ls, children: [] })) };
								}
								return null;
							})
							.filter(Boolean) as TreeNode[];

						const lvlMatches = !q || lvl.title.toLowerCase().includes(q) || lvl.id.toLowerCase().includes(q);
						const lvlStatusMatches = selectedStatusFilter === 'all' || lvl.status === selectedStatusFilter;
						if (!q && selectedStatusFilter === 'all') {
							return { item: lvl, children: chapterNodes };
						}
						if ((lvlMatches && lvlStatusMatches) || chapterNodes.length > 0) {
							return { item: lvl, children: chapterNodes };
						}
						return null;
					})
					.filter(Boolean) as TreeNode[];

				const subMatches = !q || sub.title.toLowerCase().includes(q) || sub.id.toLowerCase().includes(q);
				const subStatusMatches = selectedStatusFilter === 'all' || sub.status === selectedStatusFilter;
				if (!q && selectedStatusFilter === 'all') {
					return { item: sub, children: levelNodes };
				}
				if ((subMatches && subStatusMatches) || levelNodes.length > 0) {
					return { item: sub, children: levelNodes };
				}
				return null;
			})
			.filter(Boolean) as TreeNode[];
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

	// Reset filters helper
	function resetFilters() {
		searchQuery = '';
		selectedSubjectFilter = 'all';
		selectedStatusFilter = 'all';
	}

	// Change Subject Helper in Modal
	function handleSubjectChange(newSub: string) {
		const validSubs = ['fundamental', 'technical', 'muamalah', 'web3'] as const;
		if (!validSubs.includes(newSub as any)) return;
		const typedSub = newSub as 'fundamental' | 'technical' | 'muamalah' | 'web3';
		createSubjectId = typedSub;

		if (createKind === 'subject') {
			createId = typedSub;
			createTitle = SUBJECT_METADATA[typedSub]?.title || '';
			createDescription = SUBJECT_METADATA[typedSub]?.desc || '';
			createParentId = 'root';
		} else if (createKind === 'level') {
			const sub = contents.find((c) => c.kind === 'subject' && c.subjectId === typedSub);
			if (sub) {
				createParentId = sub.id;
				const existingLevels = contents.filter((c) => c.kind === 'level' && c.parentId === sub.id);
				const nextLvl = existingLevels.length + 1;
				createId = `${sub.id}-l${nextLvl}`;
				createTitle = `Level ${nextLvl}: `;
			}
		} else if (createKind === 'chapter') {
			const firstLvl = contents.find((c) => c.kind === 'level' && c.subjectId === typedSub);
			if (firstLvl) {
				createParentId = firstLvl.id;
				const existingChs = contents.filter((c) => c.kind === 'chapter' && c.parentId === firstLvl.id);
				const nextCh = existingChs.length + 1;
				createId = `${firstLvl.id}-c${nextCh}`;
				createTitle = `Bab ${nextCh}: `;
			}
		} else if (createKind === 'lesson') {
			const firstCh = contents.find((c) => c.kind === 'chapter' && c.subjectId === typedSub);
			if (firstCh) {
				createParentId = firstCh.id;
				const existingLs = contents.filter((c) => c.kind === 'lesson' && c.parentId === firstCh.id);
				const nextLs = existingLs.length + 1;
				createId = `${firstCh.id}-ls${nextLs}`;
				createTitle = `Pelajaran ${nextLs}: `;
			}
		}
	}

	function handleLevelParentChange(parentId: string) {
		createParentId = parentId;
		const p = contents.find((c) => c.id === parentId);
		if (p) {
			createSubjectId = p.subjectId as 'fundamental' | 'technical' | 'muamalah' | 'web3';
			const chs = contents.filter((c) => c.kind === 'chapter' && c.parentId === p.id);
			const nextNum = chs.length + 1;
			createId = `${p.id}-c${nextNum}`;
			createTitle = `Bab ${nextNum}: `;
		}
	}

	function handleChapterParentChange(parentId: string) {
		createParentId = parentId;
		const p = contents.find((c) => c.id === parentId);
		if (p) {
			createSubjectId = p.subjectId as 'fundamental' | 'technical' | 'muamalah' | 'web3';
			const ls = contents.filter((c) => c.kind === 'lesson' && c.parentId === p.id);
			const nextNum = ls.length + 1;
			createId = `${p.id}-ls${nextNum}`;
			createTitle = `Pelajaran ${nextNum}: `;
		}
	}

	// Switch creation kind inside modal
	function setCreateKind(newKind: 'subject' | 'level' | 'chapter' | 'lesson') {
		createKind = newKind;
		createError = null;

		const subjects = contents.filter((c) => c.kind === 'subject');
		const levels = contents.filter((c) => c.kind === 'level');
		const chapters = contents.filter((c) => c.kind === 'chapter');

		if (newKind === 'subject') {
			createParentId = 'root';
			// Pick first available subject that doesn't exist yet
			const existingSubIds = subjects.map((s) => s.subjectId);
			const allSubs: Array<'fundamental' | 'technical' | 'muamalah' | 'web3'> = [
				'fundamental',
				'technical',
				'muamalah',
				'web3'
			];
			const avail = allSubs.find((s) => !existingSubIds.includes(s)) || 'fundamental';
			createSubjectId = avail;
			createId = avail;
			createTitle = SUBJECT_METADATA[avail]?.title || '';
			createDescription = SUBJECT_METADATA[avail]?.desc || '';
		} else if (newKind === 'level') {
			const sub = subjects.find((s) => s.subjectId === createSubjectId) || subjects[0];
			if (sub) {
				createParentId = sub.id;
				createSubjectId = sub.subjectId as any;
				const existingLevels = contents.filter((c) => c.kind === 'level' && c.parentId === sub.id);
				const nextLvl = existingLevels.length + 1;
				createId = `${sub.id}-l${nextLvl}`;
				createTitle = `Level ${nextLvl}: `;
			}
		} else if (newKind === 'chapter') {
			const lvl = levels.find((l) => l.subjectId === createSubjectId) || levels[0];
			if (lvl) {
				createParentId = lvl.id;
				createSubjectId = lvl.subjectId as any;
				const existingChs = contents.filter((c) => c.kind === 'chapter' && c.parentId === lvl.id);
				const nextCh = existingChs.length + 1;
				createId = `${lvl.id}-c${nextCh}`;
				createTitle = `Bab ${nextCh}: `;
			}
		} else if (newKind === 'lesson') {
			const ch = chapters.find((c) => c.subjectId === createSubjectId) || chapters[0];
			if (ch) {
				createParentId = ch.id;
				createSubjectId = ch.subjectId as any;
				const existingLs = contents.filter((c) => c.kind === 'lesson' && c.parentId === ch.id);
				const nextLs = existingLs.length + 1;
				createId = `${ch.id}-ls${nextLs}`;
				createTitle = `Pelajaran ${nextLs}: `;
			}
		}
	}

	// Open Create Modal from Header or Empty State
	function openCreateModalRoot() {
		isDirectFromNode = false;
		createError = null;

		const subjects = contents.filter((c) => c.kind === 'subject');
		const levels = contents.filter((c) => c.kind === 'level');
		const chapters = contents.filter((c) => c.kind === 'chapter');

		if (subjects.length === 0) {
			setCreateKind('subject');
		} else if (levels.length === 0) {
			setCreateKind('level');
		} else if (chapters.length === 0) {
			setCreateKind('chapter');
		} else {
			setCreateKind('lesson');
		}

		createScopeId = null;
		createDurationMinutes = 15;
		createInstructor = 'Tim Edukasi CryptoSharia';
		createSyariahRequired = false;
		showCreateModal = true;
	}

	// Open Create Modal directly from existing node (+ Level, + Bab, + Pelajaran)
	function openCreateModal(kind: 'level' | 'chapter' | 'lesson', parent: AdminContentDto) {
		isDirectFromNode = true;
		createError = null;
		createKind = kind;
		createParentId = parent.id;
		createSubjectId = parent.subjectId as any;

		const siblings = contents.filter((c) => c.parentId === parent.id);
		const nextNum = siblings.length + 1;

		if (kind === 'level') {
			createTitle = `Level ${nextNum}: `;
			createId = `${parent.id}-l${nextNum}`;
			createDescription = '';
		} else if (kind === 'chapter') {
			createTitle = `Bab ${nextNum}: `;
			createId = `${parent.id}-c${nextNum}`;
			createDescription = '';
		} else {
			createTitle = `Pelajaran ${nextNum}: `;
			createId = `${parent.id}-ls${nextNum}`;
			createDescription = '';
		}

		createScopeId = parent.scopeId || null;
		createDurationMinutes = 15;
		createInstructor = parent.instructor || 'Tim Edukasi CryptoSharia';
		createSyariahRequired = false;
		showCreateModal = true;
	}

	async function handleCreateEntity() {
		createError = null;

		const titleTrim = createTitle.trim();
		const idTrim = createId.trim().toLowerCase();

		if (!titleTrim || !idTrim) {
			createError = 'Judul dan ID/Slug wajib diisi.';
			toast.error('Judul dan ID/Slug wajib diisi.');
			return;
		}

		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(idTrim)) {
			createError = 'Format ID/Slug hanya boleh huruf kecil, angka, dan tanda hubung.';
			toast.error(createError);
			return;
		}

		// Validation for Subject
		if (createKind === 'subject') {
			const duplicate = contents.some((c) => c.kind === 'subject' && c.subjectId === createSubjectId);
			if (duplicate) {
				createError = `Subjek "${SUBJECT_METADATA[createSubjectId]?.title || createSubjectId}" sudah ada dalam kurikulum.`;
				toast.error(createError);
				return;
			}
			createParentId = 'root';
			createId = createSubjectId;
		} else {
			// Validation for Level, Chapter, Lesson parent
			const parent = contents.find((c) => c.id === createParentId);
			if (!parent) {
				createError = `Induk kurikulum tidak ditemukan untuk ${createKind}.`;
				toast.error(createError);
				return;
			}
		}

		isCreating = true;
		try {
			// Compute next order
			const siblings = contents.filter((c) => c.parentId === createParentId);
			const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order)) + 1 : 0;

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
				scopeId: createKind === 'lesson' ? (createScopeId || null) : null,
				title: titleTrim,
				description: createDescription.trim(),
				thumbnail: '/favicon.png',
				durationSeconds: createKind === 'lesson' ? Math.max(0, Math.round(Number(createDurationMinutes) * 60)) : 0,
				instructor: createInstructor.trim(),
				syariahRequired: createKind === 'lesson' ? Boolean(createSyariahRequired) : false
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
			if (createParentId !== 'root') {
				expandedNodes[createParentId] = true;
			}
			selectContentItem(json);
			showCreateModal = false;
			toast.success(`Berhasil menambahkan ${createKind}: "${json.title}"`);
		} catch (err: any) {
			const msg = err.message || 'Terjadi kesalahan saat membuat entitas kurikulum';
			createError = msg;
			toast.error(msg);
		} finally {
			isCreating = false;
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

		<!-- Actions and View toggle -->
		<div class="flex items-center gap-2.5">
			{#if data.permissions.canManage}
				<button
					onclick={openCreateModalRoot}
					class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 shrink-0"
				>
					<Plus class="h-4 w-4" />
					<span>Tambah Materi</span>
				</button>
			{/if}

			<!-- Mobile view toggle -->
			<div class="inline-flex rounded-lg border border-border bg-card p-1 md:hidden">
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
				{#if contents.length === 0}
					<!-- Empty State 1: Truly Empty Database -->
					<div class="p-6 text-center text-xs space-y-3 bg-muted/10 rounded-xl border border-dashed border-border/80">
						<div class="h-10 w-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
							<BookOpen class="h-5 w-5" />
						</div>
						<div class="space-y-1">
							<h3 class="font-bold text-foreground text-sm">Kurikulum Masih Kosong</h3>
							<p class="text-muted-foreground max-w-xs mx-auto leading-relaxed">
								Belum ada kurikulum yang dibuat di CryptoSharia Academy. Mulai dengan membuat Subjek pertama untuk membangun hierarki pembelajaran.
							</p>
						</div>
						{#if data.permissions.canManage}
							<button
								onclick={openCreateModalRoot}
								class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50"
							>
								<Plus class="h-3.5 w-3.5" />
								Buat Materi Pertama
							</button>
						{:else}
							<p class="text-[11px] text-muted-foreground italic">
								Hubungi administrator untuk mulai menambahkan materi.
							</p>
						{/if}
					</div>
				{:else if hierarchicalTree().length === 0}
					<!-- Empty State 2: Filter Mismatch -->
					<div class="p-6 text-center text-xs text-muted-foreground space-y-3 bg-muted/10 rounded-xl border border-border/50">
						<Search class="h-8 w-8 mx-auto opacity-30" />
						<div class="space-y-1">
							<h3 class="font-bold text-foreground text-sm">Tidak Ada Materi yang Cocok</h3>
							<p class="max-w-xs mx-auto">
								Tidak ditemukan materi kurikulum yang cocok dengan pencarian atau filter status yang dipilih.
							</p>
						</div>
						<button
							onclick={resetFilters}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-medium text-xs transition-colors"
						>
							Reset Filter & Pencarian
						</button>
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
				{#if contents.length === 0}
					<!-- Onboarding & Hierarchy Guide when Database is Completely Empty -->
					<div class="rounded-xl border border-dashed border-border bg-card p-6 sm:p-10 text-center space-y-6">
						<div class="h-12 w-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
							<BookOpen class="h-6 w-6" />
						</div>
						<div class="space-y-2 max-w-lg mx-auto">
							<h3 class="text-base sm:text-lg font-bold text-foreground">
								Mulai Membangun Kurikulum CryptoSharia
							</h3>
							<p class="text-xs text-muted-foreground leading-relaxed">
								Struktur kurikulum Academy disusun secara berjenjang dalam 4 tingkatan untuk menjamin pembelajaran yang terstruktur dan terstandarisasi syariah:
							</p>
						</div>

						<!-- 4-Tier Hierarchy Diagram Cards -->
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left max-w-2xl mx-auto">
							<div class="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
								<div class="flex items-center gap-1.5 text-orange-500 font-bold text-xs">
									<span class="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center text-[10px]">1</span>
									Subjek
								</div>
								<p class="text-[11px] text-muted-foreground">Bidang ilmu utama (Fundamental, Teknikal, Muamalah, Web3).</p>
							</div>
							<div class="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
								<div class="flex items-center gap-1.5 text-blue-500 font-bold text-xs">
									<span class="w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px]">2</span>
									Level
								</div>
								<p class="text-[11px] text-muted-foreground">Tingkatan kompetensi siswa (Level 1, Level 2, dst).</p>
							</div>
							<div class="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
								<div class="flex items-center gap-1.5 text-emerald-500 font-bold text-xs">
									<span class="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px]">3</span>
									Bab
								</div>
								<p class="text-[11px] text-muted-foreground">Topik bahasan kurikulum dalam satu level pembelajaran.</p>
							</div>
							<div class="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
								<div class="flex items-center gap-1.5 text-amber-500 font-bold text-xs">
									<span class="w-4 h-4 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px]">4</span>
									Pelajaran
								</div>
								<p class="text-[11px] text-muted-foreground">Materi video YouTube, referensi, dan asesmen syariah.</p>
							</div>
						</div>

						{#if data.permissions.canManage}
							<div class="pt-2">
								<button
									onclick={openCreateModalRoot}
									class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50"
								>
									<Plus class="h-4 w-4" />
									Buat Materi Pertama
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Standard Selection Guide when content exists -->
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
				{/if}
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

<!-- CREATE ENTITY MODAL (GUIDED 4-TIER CREATOR) -->
{#if showCreateModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={(e) => {
			if (e.key === 'Escape') showCreateModal = false;
		}}
	>
		<div class="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between border-b border-border pb-3">
				<div>
					<h3 class="text-sm font-bold text-foreground flex items-center gap-2">
						<Plus class="h-4 w-4 text-orange-500" />
						Tambah {createKind.toUpperCase()} Kurikulum
					</h3>
					<p class="text-[11px] text-muted-foreground mt-0.5">
						{#if createKind === 'subject'}
							Tingkat 1 dari 4: Bidang ilmu utama kurikulum CryptoSharia.
						{:else if createKind === 'level'}
							Tingkat 2 dari 4: Jenjang kompetensi di bawah subjek.
						{:else if createKind === 'chapter'}
							Tingkat 3 dari 4: Bab materi bahasan dalam satu level.
						{:else}
							Tingkat 4 dari 4: Materi pelajaran spesifik dengan video & materi bacaan.
						{/if}
					</p>
				</div>
				<button
					onclick={() => (showCreateModal = false)}
					aria-label="Tutup modal"
					class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- Inline Error Banner -->
			{#if createError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
					<AlertCircle class="h-4 w-4 shrink-0 mt-0.5" />
					<span>{createError}</span>
				</div>
			{/if}

			<!-- Kind Selector Tabs (Only active when opened globally, not locked from node) -->
			{#if !isDirectFromNode}
				<div class="space-y-1">
					<span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tingkatan Entitas</span>
					<div class="grid grid-cols-4 gap-1.5 p-1 rounded-lg border border-border bg-muted/30 text-xs">
						<button
							type="button"
							onclick={() => setCreateKind('subject')}
							class="py-1.5 px-2 rounded-md font-semibold text-center transition-colors {createKind === 'subject' ? 'bg-orange-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
						>
							1. Subjek
						</button>
						<button
							type="button"
							onclick={() => setCreateKind('level')}
							disabled={contents.filter((c) => c.kind === 'subject').length === 0}
							class="py-1.5 px-2 rounded-md font-semibold text-center transition-colors {createKind === 'level' ? 'bg-orange-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed'}"
						>
							2. Level
						</button>
						<button
							type="button"
							onclick={() => setCreateKind('chapter')}
							disabled={contents.filter((c) => c.kind === 'level').length === 0}
							class="py-1.5 px-2 rounded-md font-semibold text-center transition-colors {createKind === 'chapter' ? 'bg-orange-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed'}"
						>
							3. Bab
						</button>
						<button
							type="button"
							onclick={() => setCreateKind('lesson')}
							disabled={contents.filter((c) => c.kind === 'chapter').length === 0}
							class="py-1.5 px-2 rounded-md font-semibold text-center transition-colors {createKind === 'lesson' ? 'bg-orange-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed'}"
						>
							4. Pelajaran
						</button>
					</div>
				</div>
			{/if}

			<div class="space-y-3.5 text-xs">
				<!-- SUBJEK FORM -->
				{#if createKind === 'subject'}
					<div class="space-y-1.5">
						<label for="create-subject-select" class="font-semibold text-foreground">Pilih Bidang Subjek Resmi *</label>
						<select
							id="create-subject-select"
							value={createSubjectId}
							onchange={(e) => handleSubjectChange(e.currentTarget.value)}
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						>
							<option value="fundamental">Analisis Fundamental (fundamental)</option>
							<option value="technical">Analisis Teknikal (technical)</option>
							<option value="muamalah">Fikih & Muamalah Aset Kripto (muamalah)</option>
							<option value="web3">Web3 & Ekosistem Blockchain (web3)</option>
						</select>
						{#if contents.some((c) => c.kind === 'subject' && c.subjectId === createSubjectId)}
							<p class="text-[11px] text-amber-500 font-medium">
								⚠️ Subjek ini sudah ada dalam kurikulum. Silakan pilih subjek lain atau buat Level di bawah subjek ini.
							</p>
						{/if}
					</div>

					<div class="space-y-1">
						<label for="create-title-sub" class="font-semibold text-foreground">Nama Tampilan Subjek *</label>
						<input
							id="create-title-sub"
							type="text"
							bind:value={createTitle}
							placeholder="cth: Fikih & Muamalah Aset Kripto"
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="create-desc-sub" class="font-semibold text-foreground">Deskripsi Subjek</label>
						<textarea
							id="create-desc-sub"
							rows="3"
							bind:value={createDescription}
							placeholder="Deskripsi singkat materi subjek..."
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						></textarea>
					</div>

					<div class="space-y-1">
						<label for="create-id-sub" class="font-semibold text-foreground">ID Subjek (Sistem)</label>
						<input
							id="create-id-sub"
							type="text"
							value={createSubjectId}
							readonly
							class="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground cursor-not-allowed"
						/>
						<span class="text-[10px] text-muted-foreground block">
							Aturan backend: ID subjek utama wajib identik dengan nama subjek (`parentId: 'root'`).
						</span>
					</div>

				<!-- LEVEL FORM -->
				{:else if createKind === 'level'}
					{#if !isDirectFromNode}
						<div class="space-y-1">
							<label for="create-parent-sub" class="font-semibold text-foreground">Subjek Induk *</label>
							<select
								id="create-parent-sub"
								value={createSubjectId}
								onchange={(e) => handleSubjectChange(e.currentTarget.value)}
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
							>
								{#each contents.filter((c) => c.kind === 'subject') as sub}
									<option value={sub.subjectId}>{sub.title} ({sub.subjectId})</option>
								{/each}
							</select>
						</div>
					{:else}
						<div class="p-2.5 rounded-lg border border-border bg-muted/20 text-xs flex items-center justify-between">
							<span class="text-muted-foreground">Subjek Induk:</span>
							<span class="font-bold text-foreground uppercase">{createSubjectId}</span>
						</div>
					{/if}

					<div class="space-y-1">
						<label for="create-title-lvl" class="font-semibold text-foreground">Judul Level *</label>
						<input
							id="create-title-lvl"
							type="text"
							bind:value={createTitle}
							placeholder="cth: Level 1: Fondasi Maal & Sil'ah"
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="create-id-lvl" class="font-semibold text-foreground">ID / Slug Level *</label>
						<input
							id="create-id-lvl"
							type="text"
							bind:value={createId}
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-orange-500 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="create-desc-lvl" class="font-semibold text-foreground">Deskripsi Level</label>
						<textarea
							id="create-desc-lvl"
							rows="2"
							bind:value={createDescription}
							placeholder="Capaian pembelajaran pada level ini..."
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						></textarea>
					</div>

				<!-- CHAPTER / BAB FORM -->
				{:else if createKind === 'chapter'}
					{#if !isDirectFromNode}
						<div class="space-y-1">
							<label for="create-parent-lvl" class="font-semibold text-foreground">Level Induk *</label>
							<select
								id="create-parent-lvl"
								bind:value={createParentId}
								onchange={(e) => handleLevelParentChange(e.currentTarget.value)}
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
							>
								{#each contents.filter((c) => c.kind === 'level') as lvl}
									<option value={lvl.id}>{lvl.title} [{lvl.subjectId.toUpperCase()}]</option>
								{/each}
							</select>
						</div>
					{:else}
						<div class="p-2.5 rounded-lg border border-border bg-muted/20 text-xs flex items-center justify-between">
							<span class="text-muted-foreground">Level Induk:</span>
							<span class="font-bold text-foreground">{createParentId}</span>
						</div>
					{/if}

					<div class="space-y-1">
						<label for="create-title-ch" class="font-semibold text-foreground">Judul Bab *</label>
						<input
							id="create-title-ch"
							type="text"
							bind:value={createTitle}
							placeholder="cth: Bab 1: Definisi Maal Mutaqawwam"
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="create-id-ch" class="font-semibold text-foreground">ID / Slug Bab *</label>
						<input
							id="create-id-ch"
							type="text"
							bind:value={createId}
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-orange-500 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="create-desc-ch" class="font-semibold text-foreground">Deskripsi Bab</label>
						<textarea
							id="create-desc-ch"
							rows="2"
							bind:value={createDescription}
							placeholder="Pokok materi yang dibahas dalam bab ini..."
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						></textarea>
					</div>

				<!-- LESSON / PELAJARAN FORM -->
				{:else}
					{#if !isDirectFromNode}
						<div class="space-y-1">
							<label for="create-parent-ch" class="font-semibold text-foreground">Bab Induk *</label>
							<select
								id="create-parent-ch"
								bind:value={createParentId}
								onchange={(e) => handleChapterParentChange(e.currentTarget.value)}
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
							>
								{#each contents.filter((c) => c.kind === 'chapter') as ch}
									<option value={ch.id}>{ch.title} [{ch.subjectId.toUpperCase()}]</option>
								{/each}
							</select>
						</div>
					{:else}
						<div class="p-2.5 rounded-lg border border-border bg-muted/20 text-xs flex items-center justify-between">
							<span class="text-muted-foreground">Bab Induk:</span>
							<span class="font-bold text-foreground">{createParentId}</span>
						</div>
					{/if}

					<div class="space-y-1">
						<label for="create-title-ls" class="font-semibold text-foreground">Judul Pelajaran *</label>
						<input
							id="create-title-ls"
							type="text"
							bind:value={createTitle}
							placeholder="cth: Pelajaran 1: Hakikat Uang dalam Fikih Klasik"
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="create-id-ls" class="font-semibold text-foreground">ID / Slug Pelajaran *</label>
						<input
							id="create-id-ls"
							type="text"
							bind:value={createId}
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-orange-500 focus:outline-none"
						/>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
							<label for="create-duration" class="font-semibold text-foreground">Estimasi Durasi (Menit)</label>
							<input
								id="create-duration"
								type="number"
								min="1"
								max="300"
								bind:value={createDurationMinutes}
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
							/>
						</div>
					</div>

					<div class="space-y-1">
						<label for="create-instructor" class="font-semibold text-foreground">Nama Pengajar / Narasumber</label>
						<input
							id="create-instructor"
							type="text"
							bind:value={createInstructor}
							placeholder="cth: Tim Edukasi CryptoSharia"
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						/>
					</div>

					<div class="space-y-1">
						<label for="create-desc-ls" class="font-semibold text-foreground">Deskripsi Ringkas</label>
						<textarea
							id="create-desc-ls"
							rows="2"
							bind:value={createDescription}
							placeholder="Ringkasan poin yang dipelajari pada materi ini..."
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none"
						></textarea>
					</div>

					<div class="pt-1">
						<label class="flex items-center gap-2 cursor-pointer select-none">
							<input
								type="checkbox"
								bind:checked={createSyariahRequired}
								class="rounded border-border text-orange-500 focus:ring-orange-500"
							/>
							<span class="text-xs font-medium text-foreground">Wajib Review Kepatuhan Syariah</span>
						</label>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
				<button
					type="button"
					onclick={() => (showCreateModal = false)}
					disabled={isCreating}
					class="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors disabled:opacity-50"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={handleCreateEntity}
					disabled={isCreating || (createKind === 'subject' && contents.some((c) => c.kind === 'subject' && c.subjectId === createSubjectId))}
					class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isCreating}
						<Loader2 class="h-3.5 w-3.5 animate-spin" />
						<span>Menyimpan...</span>
					{:else}
						<span>Simpan {createKind.toUpperCase()}</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- REVIEW & WORKFLOW MODAL -->
{#if showReviewModal && selectedItem}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={(e) => {
			if (e.key === 'Escape') showReviewModal = false;
		}}
	>
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
