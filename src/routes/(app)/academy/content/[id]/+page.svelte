<script lang="ts">
	import { resolve } from '$app/paths';
	import { BookOpen, ChevronRight, ShieldCheck, Video, Calendar, User, ArrowLeft } from 'lucide-svelte';

	let { data } = $props();
	const item = $derived(data.content);
</script>

<svelte:head>
	<title>{item.title} | CryptoSharia Academy</title>
</svelte:head>

<div class="space-y-6 max-w-4xl">
	<div class="flex items-center gap-2 text-xs text-muted-foreground">
		<a href={resolve('/academy/overview')} class="hover:underline">Academy</a>
		<ChevronRight class="h-3 w-3" />
		<a href={resolve('/academy/courses')} class="hover:underline">Kurikulum</a>
		<ChevronRight class="h-3 w-3" />
		<span class="text-foreground truncate">{item.title}</span>
	</div>

	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
				<BookOpen class="h-6 w-6 text-orange-500" />
				{item.title}
			</h1>
			<p class="text-xs font-mono text-muted-foreground mt-1">ID: {item.id}</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href={resolve('/academy/courses')}
				class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
			>
				<ArrowLeft class="h-3.5 w-3.5" /> Kembali
			</a>
		</div>
	</div>

	<!-- Detail Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="md:col-span-2 space-y-6">
			<div class="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
				<h2 class="text-base font-semibold text-foreground">Informasi Materi</h2>
				
				<div class="space-y-3 text-sm">
					<div>
						<span class="text-xs text-muted-foreground block">Deskripsi:</span>
						<p class="text-foreground mt-1 whitespace-pre-wrap">{item.description || 'Tidak ada deskripsi.'}</p>
					</div>

					<div class="grid grid-cols-2 gap-4 pt-2">
						<div>
							<span class="text-xs text-muted-foreground block">Tipe / Kind:</span>
							<span class="font-medium capitalize text-foreground">{item.kind}</span>
						</div>
						<div>
							<span class="text-xs text-muted-foreground block">Subject:</span>
							<span class="font-medium uppercase text-foreground">{item.subjectId}</span>
						</div>
						<div>
							<span class="text-xs text-muted-foreground block">Level & Bab:</span>
							<span class="font-medium text-foreground">Level {item.level} / Bab {item.chapterNumber}</span>
						</div>
						<div>
							<span class="text-xs text-muted-foreground block">Urutan (Order):</span>
							<span class="font-medium text-foreground">{item.order}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Sidebar Status Card -->
		<div class="space-y-6">
			<div class="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
				<h2 class="text-base font-semibold text-foreground">Status & Review</h2>
				
				<div class="space-y-3 text-sm">
					<div>
						<span class="text-xs text-muted-foreground block">Status Publikasi:</span>
						<span class="inline-block mt-1 px-2.5 py-1 rounded text-xs font-semibold capitalize border {item.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}">
							{item.status}
						</span>
					</div>

					<div>
						<span class="text-xs text-muted-foreground block">Review Syariah:</span>
						<span class="inline-flex items-center gap-1.5 mt-1 text-xs font-medium {item.syariahRequired ? 'text-amber-500' : 'text-muted-foreground'}">
							<ShieldCheck class="h-4 w-4" />
							{item.syariahRequired ? 'Wajib Review Syariah' : 'Tidak Wajib'}
						</span>
					</div>

					<div>
						<span class="text-xs text-muted-foreground block">Instruktur:</span>
						<span class="text-foreground">{item.instructor || '-'}</span>
					</div>

					<div>
						<span class="text-xs text-muted-foreground block">Durasi Pembelajaran:</span>
						<span class="text-foreground">{item.durationSeconds ? Math.floor(item.durationSeconds / 60) + ' menit' : '-'}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
