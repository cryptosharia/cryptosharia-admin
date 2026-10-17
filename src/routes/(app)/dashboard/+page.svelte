<script lang="ts">
	import {
		TrendingUp,
		Users,
		FileText,
		Activity,
		ShieldCheck,
		BookOpen,
		GraduationCap,
		CheckSquare,
		Layers,
		KeyRound,
		AlertTriangle,
		ArrowRight,
		Clock,
		Plus,
		CheckCircle,
		Sparkles
	} from 'lucide-svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const ADMIN_GUIDE_URL = 'https://anything.mdaffailhami.my.id/cryptosharia-admin-guide';
</script>

<svelte:head>
	<title>Unified Admin Dashboard | CryptoSharia</title>
</svelte:head>

<div class="space-y-6">
	<!-- Top Banner & System Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-500 border border-orange-500/20">
					<Sparkles class="h-3 w-3" /> Unified Portal v2.0
				</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
				Dashboard Operasional
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
				Pusat pemantauan ekosistem CryptoSharia, kurikulum pembelajaran, dan screening aset.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button
				href={ADMIN_GUIDE_URL}
				variant="outline"
				size="sm"
				target="_blank"
				rel="noopener noreferrer"
				class="shrink-0 text-xs border-border bg-card hover:bg-muted"
			>
				<BookOpen class="h-3.5 w-3.5 mr-1.5" />
				Panduan Admin
			</Button>
		</div>
	</div>

	<!-- Pending Review Alert (Real Academy Gate) -->
	{#if data.canAcademy && (data.academyStats?.reviewContent ?? 0) > 0}
		<div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 text-amber-500 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div class="flex items-start gap-3">
				<div class="rounded-lg bg-amber-500/20 p-2 text-amber-500 shrink-0 mt-0.5">
					<AlertTriangle class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-sm sm:text-base font-bold text-foreground">
						{data.academyStats?.reviewContent} Materi Menunggu Review Syariah & Editorial
					</h3>
					<p class="text-xs text-muted-foreground mt-0.5">
						Terdapat materi kurikulum baru yang diajukan oleh penyusun dan memerlukan verifikasi kepatuhan sebelum dipublikasikan.
					</p>
				</div>
			</div>
			<a
				href={resolve('/academy/editorial')}
				class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors shrink-0"
			>
				Buka Antrean Review
				<ArrowRight class="h-3.5 w-3.5" />
			</a>
		</div>
	{/if}

	<!-- Quick Actions Row -->
	<section class="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
		<h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
			Aksi Cepat (Quick Actions)
		</h2>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
			{#if data.canAcademy}
				<a
					href={resolve('/academy/courses')}
					class="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/30 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all text-xs font-medium text-foreground group"
				>
					<div class="p-1.5 rounded bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
						<Plus class="h-4 w-4" />
					</div>
					<span class="truncate">Tambah Materi</span>
				</a>

				<a
					href={resolve('/academy/editorial')}
					class="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/30 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-xs font-medium text-foreground group"
				>
					<div class="p-1.5 rounded bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
						<CheckSquare class="h-4 w-4" />
					</div>
					<span class="truncate">Review Syariah</span>
				</a>

				<a
					href={resolve('/academy/scopes')}
					class="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/30 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all text-xs font-medium text-foreground group"
				>
					<div class="p-1.5 rounded bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
						<Layers class="h-4 w-4" />
					</div>
					<span class="truncate">Kelola Scope</span>
				</a>

				<a
					href={resolve('/academy/grants')}
					class="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/30 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-xs font-medium text-foreground group"
				>
					<div class="p-1.5 rounded bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
						<KeyRound class="h-4 w-4" />
					</div>
					<span class="truncate">Beri Akses Siswa</span>
				</a>
			{/if}

			<a
				href={resolve('/posts/new')}
				class="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/30 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all text-xs font-medium text-foreground group"
			>
				<div class="p-1.5 rounded bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
					<FileText class="h-4 w-4" />
				</div>
				<span class="truncate">Tulis Artikel</span>
			</a>
		</div>
	</section>

	<!-- Real KPI Metrics Grid -->
	<section>
		<h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
			Metrik Ekosistem & Pembelajaran
		</h2>

		{#await data.ecosystemCounts}
			<!-- Skeleton loading -->
			<div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				{#each Array(4) as _}
					<div class="h-24 animate-pulse rounded-xl border border-border bg-muted/40 p-4"></div>
				{/each}
			</div>
		{:then counts}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
				<!-- 1. Total Lessons -->
				{#if data.canAcademy && data.academyStats}
					<Card class="hover:border-orange-500/40 transition-colors">
						<CardHeader class="flex flex-row items-center justify-between pb-1 pt-3.5 px-3.5">
							<CardTitle class="text-[11px] font-semibold text-muted-foreground">Materi Pelajaran</CardTitle>
							<GraduationCap class="h-4 w-4 text-orange-500" />
						</CardHeader>
						<CardContent class="px-3.5 pb-3.5">
							<div class="text-2xl font-black text-foreground">{data.academyStats.totalLessons}</div>
							<p class="text-[10px] text-muted-foreground mt-0.5">{data.academyStats.publishedLessons} telah terbit</p>
						</CardContent>
					</Card>
				{/if}

				<!-- 2. Registered Users -->
				<Card class="hover:border-orange-500/40 transition-colors">
					<CardHeader class="flex flex-row items-center justify-between pb-1 pt-3.5 px-3.5">
						<CardTitle class="text-[11px] font-semibold text-muted-foreground">Total Pengguna</CardTitle>
						<Users class="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent class="px-3.5 pb-3.5">
						<div class="text-2xl font-black text-foreground">{counts.userCount.toLocaleString()}</div>
						<p class="text-[10px] text-muted-foreground mt-0.5">Siswa & Pengelola</p>
					</CardContent>
				</Card>

				<!-- 3. Tokens Tracked -->
				<Card class="hover:border-orange-500/40 transition-colors">
					<CardHeader class="flex flex-row items-center justify-between pb-1 pt-3.5 px-3.5">
						<CardTitle class="text-[11px] font-semibold text-muted-foreground">Aset Kripto</CardTitle>
						<TrendingUp class="h-4 w-4 text-emerald-500" />
					</CardHeader>
					<CardContent class="px-3.5 pb-3.5">
						<div class="text-2xl font-black text-foreground">{counts.tokenCount.toLocaleString()}</div>
						<p class="text-[10px] text-muted-foreground mt-0.5">Diskrining syariah</p>
					</CardContent>
				</Card>

				<!-- 4. Posts Published -->
				<Card class="hover:border-orange-500/40 transition-colors">
					<CardHeader class="flex flex-row items-center justify-between pb-1 pt-3.5 px-3.5">
						<CardTitle class="text-[11px] font-semibold text-muted-foreground">Artikel Terbit</CardTitle>
						<FileText class="h-4 w-4 text-purple-500" />
					</CardHeader>
					<CardContent class="px-3.5 pb-3.5">
						<div class="text-2xl font-black text-foreground">{counts.postCount.toLocaleString()}</div>
						<p class="text-[10px] text-muted-foreground mt-0.5">Publikasi edukasi</p>
					</CardContent>
				</Card>

				<!-- 5. Active Scopes -->
				{#if data.canAcademy && data.academyStats}
					<Card class="hover:border-orange-500/40 transition-colors">
						<CardHeader class="flex flex-row items-center justify-between pb-1 pt-3.5 px-3.5">
							<CardTitle class="text-[11px] font-semibold text-muted-foreground">Scope Akses</CardTitle>
							<Layers class="h-4 w-4 text-indigo-500" />
						</CardHeader>
						<CardContent class="px-3.5 pb-3.5">
							<div class="text-2xl font-black text-foreground">{data.academyStats.totalScopes}</div>
							<p class="text-[10px] text-muted-foreground mt-0.5">Tingkatan program</p>
						</CardContent>
					</Card>
				{/if}

				<!-- 6. Student Grants -->
				{#if data.canAcademy && data.academyStats}
					<Card class="hover:border-orange-500/40 transition-colors">
						<CardHeader class="flex flex-row items-center justify-between pb-1 pt-3.5 px-3.5">
							<CardTitle class="text-[11px] font-semibold text-muted-foreground">Hak Akses Siswa</CardTitle>
							<KeyRound class="h-4 w-4 text-emerald-500" />
						</CardHeader>
						<CardContent class="px-3.5 pb-3.5">
							<div class="text-2xl font-black text-foreground">{data.academyStats.totalGrants}</div>
							<p class="text-[10px] text-muted-foreground mt-0.5">Siswa terdaftar</p>
						</CardContent>
					</Card>
				{/if}
			</div>
		{/await}
	</section>

	<!-- Main Details Split: Pending Review Queue vs Ecosystem Status -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left: Recent Review Items (2 cols) -->
		<div class="lg:col-span-2 space-y-4">
			<Card class="h-full">
				<CardHeader class="flex flex-row items-center justify-between pb-3 border-b border-border/50">
					<CardTitle class="text-sm sm:text-base font-bold flex items-center gap-2">
						<Clock class="h-4 w-4 text-amber-500" />
						Antrean Verifikasi Editorial Terkini
					</CardTitle>
					{#if data.canAcademy}
						<a
							href={resolve('/academy/editorial')}
							class="text-xs font-medium text-orange-500 hover:underline flex items-center gap-1"
						>
							Lihat Semua &rarr;
						</a>
					{/if}
				</CardHeader>
				<CardContent class="pt-4">
					{#if !data.canAcademy}
						<div class="p-8 text-center text-xs text-muted-foreground">
							Akses modul Academy memerlukan izin administrator akademi.
						</div>
					{:else if data.pendingReviews.length === 0}
						<div class="p-8 text-center text-xs text-muted-foreground space-y-2">
							<CheckCircle class="h-8 w-8 mx-auto text-emerald-500/60" />
							<p class="font-medium text-foreground">Semua Materi Telah Diverifikasi</p>
							<p>Tidak ada draf yang sedang menunggu persetujuan review syariah.</p>
						</div>
					{:else}
						<div class="divide-y divide-border/60">
							{#each data.pendingReviews as item}
								<div class="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
									<div class="space-y-0.5 min-w-0">
										<div class="flex items-center gap-2">
											<span class="text-xs font-semibold text-foreground truncate">{item.title}</span>
											<span class="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20 uppercase">
												{item.status}
											</span>
										</div>
										<p class="text-[11px] text-muted-foreground truncate">
											{item.subjectId.toUpperCase()} &bull; Level {item.level} &bull; Bab {item.chapterNumber} &bull; Instruktur: {item.instructor || '-'}
										</p>
									</div>
									<a
										href={`/academy/courses?select=${item.id}`}
										class="shrink-0 px-2.5 py-1 rounded text-[11px] font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors"
									>
										Tinjau
									</a>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Right: Clean Real System Health & Status -->
		<div class="space-y-4">
			<Card>
				<CardHeader class="pb-3 border-b border-border/50">
					<CardTitle class="text-sm font-bold flex items-center gap-2">
						<ShieldCheck class="h-4 w-4 text-emerald-500" />
						Integritas & Status Sistem
					</CardTitle>
				</CardHeader>
				<CardContent class="pt-4 space-y-3.5 text-xs">
					<div class="flex items-center justify-between py-1 border-b border-border/40">
						<span class="text-muted-foreground">Portal Terpusat</span>
						<span class="font-semibold text-foreground">admin.cryptosharia.id</span>
					</div>
					<div class="flex items-center justify-between py-1 border-b border-border/40">
						<span class="text-muted-foreground">Backend API</span>
						<span class="inline-flex items-center gap-1.5 font-semibold text-emerald-500">
							<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
							Online (v2.0)
						</span>
					</div>
					<div class="flex items-center justify-between py-1 border-b border-border/40">
						<span class="text-muted-foreground">Autentikasi Session</span>
						<span class="font-semibold text-foreground capitalize">{data.user?.role?.replace('_', ' ') ?? 'Admin'}</span>
					</div>
					<div class="flex items-center justify-between py-1 border-b border-border/40">
						<span class="text-muted-foreground">Kepatuhan Syariah</span>
						<span class="font-semibold text-emerald-500">Dual-Gate Enforced</span>
					</div>
					<div class="flex items-center justify-between py-1">
						<span class="text-muted-foreground">Keamanan Sesi</span>
						<span class="font-semibold text-foreground">Strict Host-Only Cookie</span>
					</div>
				</CardContent>
			</Card>

			<!-- Quick Link to Documentation -->
			<div class="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
				<h4 class="text-xs font-bold text-orange-500 flex items-center gap-1.5">
					<BookOpen class="h-3.5 w-3.5" />
					Panduan Operasional CMS
				</h4>
				<p class="text-[11px] text-muted-foreground leading-relaxed">
					Pelajari standar penyusunan materi kurikulum, format YouTube ID, dan alur verifikasi syariah sebelum memublikasikan pelajaran.
				</p>
				<a
					href={ADMIN_GUIDE_URL}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 hover:underline pt-1"
				>
					Buka Panduan Lengkap &rarr;
				</a>
			</div>
		</div>
	</div>
</div>
