<script lang="ts">
	import '../layout.css';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Menu, X, LayoutDashboard, BookOpen, CheckSquare, Layers } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { canManageAcademy } from '$lib/permissions';
	
	let { children, data } = $props();

	let sidebarOpen = $state(false);
	let sidebarCollapsed = $state(false);
	let progress: Pick<typeof import('nprogress'), 'start' | 'done' | 'configure'> | undefined;

	beforeNavigate(() => progress?.start());
	afterNavigate(() => progress?.done());

	onMount(async () => {
		progress = (await import('nprogress')).default;
		progress.configure({ showSpinner: false, minimum: 0.15, speed: 300 });
	});

	$effect(() => {
		const stored = localStorage.getItem('sidebar-collapsed');
		if (stored !== null) sidebarCollapsed = stored === 'true';
	});

	$effect(() => {
		localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
	});

	$effect(() => {
		$page.url.pathname;
		sidebarOpen = false;
	});

	const canAcademy = $derived(canManageAcademy(data.user?.role));
</script>

<div class="flex min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
	<!-- Mobile backdrop -->
	{#if sidebarOpen}
		<div
			class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
			onclick={() => (sidebarOpen = false)}
			onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
			role="button"
			tabindex="0"
			aria-label="Tutup menu navigasi"
		></div>
	{/if}

	<AppSidebar
		user={data.user}
		bind:collapsed={sidebarCollapsed}
		class="transition-transform duration-300 ease-in-out md:translate-x-0 {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
	/>

	<!-- Main Content Area -->
	<main
		class="flex-1 relative flex flex-col w-full min-h-screen transition-all duration-300 ease-in-out {sidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}"
	>
		<!-- Mobile top header -->
		<header class="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-md">
			<a href={resolve('/dashboard')} class="flex items-center gap-2 font-bold text-base text-foreground">
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
					<img src="/logo.png" alt="CryptoSharia" class="h-4 w-4 object-contain" />
				</div>
				<span class="tracking-tight text-sm">CryptoSharia Admin</span>
			</a>
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground transition-colors hover:bg-muted"
				aria-label={sidebarOpen ? 'Tutup navigasi' : 'Buka navigasi'}
			>
				{#if sidebarOpen}
					<X size={18} />
				{:else}
					<Menu size={18} />
				{/if}
			</button>
		</header>
		
		<!-- Page content container with safe bottom padding for mobile bottom bar -->
		<div class="flex-1 p-3.5 sm:p-6 md:p-8 space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
			{@render children()}
		</div>

		<!-- Mobile Bottom Navigation Bar -->
		<nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-md px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-lg">
			<a
				href={resolve('/dashboard')}
				class="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors {$page.url.pathname === '/dashboard' ? 'text-orange-500 font-bold' : 'text-muted-foreground hover:text-foreground'}"
			>
				<LayoutDashboard class="h-4 w-4 mb-0.5" />
				<span>Beranda</span>
			</a>

			{#if canAcademy}
				<a
					href={resolve('/academy/courses')}
					class="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors {$page.url.pathname.startsWith('/academy/courses') ? 'text-orange-500 font-bold' : 'text-muted-foreground hover:text-foreground'}"
				>
					<BookOpen class="h-4 w-4 mb-0.5" />
					<span>Kurikulum</span>
				</a>

				<a
					href={resolve('/academy/editorial')}
					class="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors {$page.url.pathname.startsWith('/academy/editorial') ? 'text-orange-500 font-bold' : 'text-muted-foreground hover:text-foreground'}"
				>
					<CheckSquare class="h-4 w-4 mb-0.5" />
					<span>Review</span>
				</a>

				<a
					href={resolve('/academy/scopes')}
					class="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors {$page.url.pathname.startsWith('/academy/scopes') ? 'text-orange-500 font-bold' : 'text-muted-foreground hover:text-foreground'}"
				>
					<Layers class="h-4 w-4 mb-0.5" />
					<span>Scope</span>
				</a>
			{/if}

			<button
				onclick={() => (sidebarOpen = true)}
				class="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
				aria-label="Buka menu lengkap"
			>
				<Menu class="h-4 w-4 mb-0.5" />
				<span>Menu</span>
			</button>
		</nav>
	</main>
</div>
