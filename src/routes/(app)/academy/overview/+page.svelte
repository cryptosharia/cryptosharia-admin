<script lang="ts">
	import { resolve } from '$app/paths';
	import { GraduationCap, BookOpen, Clock, FileCheck, Layers, KeyRound, AlertCircle } from 'lucide-svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Academy Overview | CryptoSharia Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
				<GraduationCap class="h-6 w-6 text-orange-500" />
				CryptoSharia Academy
			</h1>
			<p class="text-sm text-muted-foreground">
				Pusat pengelolaan modul, materi kurikulum, editorial review, dan hak akses pembelajaran.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href={resolve('/academy/courses')}
				class="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-600 transition-colors"
			>
				Kurikulum & Materi
			</a>
			<a
				href={resolve('/academy/editorial')}
				class="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
			>
				Antrean Editorial
			</a>
		</div>
	</div>

	{#if data.error}
		<div class="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-500 flex items-center gap-3">
			<AlertCircle class="h-5 w-5 shrink-0" />
			<p class="text-sm font-medium">{data.error}</p>
		</div>
	{/if}

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Total Pelajaran</span>
				<BookOpen class="h-5 w-5 text-muted-foreground" />
			</div>
			<div class="mt-3">
				<span class="text-3xl font-bold text-foreground">{data.stats.totalLessons}</span>
				<p class="text-xs text-muted-foreground mt-1">Terdaftar dalam kurikulum</p>
			</div>
		</div>

		<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Pelajaran Terpublikasi</span>
				<FileCheck class="h-5 w-5 text-emerald-500" />
			</div>
			<div class="mt-3">
				<span class="text-3xl font-bold text-emerald-500">{data.stats.publishedLessons}</span>
				<p class="text-xs text-muted-foreground mt-1">Dapat diakses peserta yang berhak</p>
			</div>
		</div>

		<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Antrean Review / Editorial</span>
				<Clock class="h-5 w-5 text-amber-500" />
			</div>
			<div class="mt-3">
				<span class="text-3xl font-bold text-amber-500">{data.stats.reviewContent}</span>
				<p class="text-xs text-muted-foreground mt-1">Menunggu review syariah / editorial</p>
			</div>
		</div>

		<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Draft Materi</span>
				<BookOpen class="h-5 w-5 text-blue-500" />
			</div>
			<div class="mt-3">
				<span class="text-3xl font-bold text-blue-500">{data.stats.draftContent}</span>
				<p class="text-xs text-muted-foreground mt-1">Sedang dalam penyusunan</p>
			</div>
		</div>

		<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Total Scope Akses</span>
				<Layers class="h-5 w-5 text-purple-500" />
			</div>
			<div class="mt-3">
				<span class="text-3xl font-bold text-purple-500">{data.stats.totalScopes}</span>
				<p class="text-xs text-muted-foreground mt-1">Lingkup tingkatan akses pembelajaran</p>
			</div>
		</div>

		<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Total Grants Aktif</span>
				<KeyRound class="h-5 w-5 text-indigo-500" />
			</div>
			<div class="mt-3">
				<span class="text-3xl font-bold text-indigo-500">{data.stats.totalGrants}</span>
				<p class="text-xs text-muted-foreground mt-1">Hak akses yang diberikan ke pengguna</p>
			</div>
		</div>
	</div>

	<!-- Quick Navigation Menu -->
	<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-foreground mb-4">Modul Manajemen Academy</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<a
				href={resolve('/academy/courses')}
				class="flex flex-col p-4 rounded-lg border border-border hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
			>
				<span class="font-semibold text-foreground">Kurikulum & Materi</span>
				<span class="text-xs text-muted-foreground mt-1">Kelola hierarki Subject, Level, Chapter, dan Lesson</span>
			</a>
			<a
				href={resolve('/academy/editorial')}
				class="flex flex-col p-4 rounded-lg border border-border hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
			>
				<span class="font-semibold text-foreground">Editorial & Review</span>
				<span class="text-xs text-muted-foreground mt-1">Review syariah dan penerbitan materi ke live LMS</span>
			</a>
			<a
				href={resolve('/academy/scopes')}
				class="flex flex-col p-4 rounded-lg border border-border hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
			>
				<span class="font-semibold text-foreground">Scopes / Entitlements</span>
				<span class="text-xs text-muted-foreground mt-1">Kelola tingkatan akses (free, pro, premium, VIP)</span>
			</a>
			<a
				href={resolve('/academy/grants')}
				class="flex flex-col p-4 rounded-lg border border-border hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
			>
				<span class="font-semibold text-foreground">Grants Peserta</span>
				<span class="text-xs text-muted-foreground mt-1">Pemberian dan pencabutan hak akses peserta</span>
			</a>
		</div>
	</div>
</div>
