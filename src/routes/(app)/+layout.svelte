<script lang="ts">
	import '../layout.css';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Menu, X } from 'lucide-svelte';
	import { page, navigating } from '$app/stores';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let { children, data } = $props();

	let sidebarOpen = $state(false);
	let sidebarCollapsed = $state(false);

	// NProgress
	onMount(async () => {
		const NProgress = (await import('nprogress')).default;
		NProgress.configure({ showSpinner: false, minimum: 0.15, speed: 300 });

		beforeNavigate(() => NProgress.start());
		afterNavigate(() => NProgress.done());
	});

	// Persist collapsed state
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
</script>

<div class="flex min-h-screen bg-background text-foreground font-sans overflow-hidden">
	<!-- Mobile backdrop -->
	{#if sidebarOpen}
		<div
			class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
			onclick={() => sidebarOpen = false}
			onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
			role="button"
			tabindex="0"
		></div>
	{/if}

	<AppSidebar
		user={data.user}
		bind:collapsed={sidebarCollapsed}
		class="transition-transform duration-300 ease-in-out md:translate-x-0 {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
	/>

	<!-- Main Content -->
	<main
		class="flex-1 relative flex flex-col w-full min-h-screen transition-all duration-300 ease-in-out {sidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}"
	>
		<!-- Mobile header -->
		<header class="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
			<div class="flex items-center gap-2 font-bold text-lg">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
					<img src="/logo.png" alt="CryptoSharia" class="h-6 w-6 object-contain" />
				</div>
				<span>CS Admin</span>
			</div>
			<button onclick={() => sidebarOpen = !sidebarOpen} class="p-2 bg-muted rounded-md">
				{#if sidebarOpen}
					<X size={20} />
				{:else}
					<Menu size={20} />
				{/if}
			</button>
		</header>
		
		<div class="flex-1 p-4 md:p-8 md:pt-6 space-y-4 overflow-x-hidden">
			{@render children()}
		</div>
	</main>
</div>
