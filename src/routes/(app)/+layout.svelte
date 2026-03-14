<script lang="ts">
	import '../layout.css';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Menu, X } from 'lucide-svelte';
	import { page } from '$app/stores';
	
	let { children, data } = $props();

	let sidebarOpen = $state(false);

	$effect(() => {
		// Close sidebar on navigation change
		$page.url.pathname;
		sidebarOpen = false;
	});
</script>

<div class="flex min-h-screen bg-background text-foreground font-sans overflow-hidden">
	<!-- Mobile backdrop -->
	{#if sidebarOpen}
		<div class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity md:hidden opacity-100" onclick={() => sidebarOpen = false} onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)} role="button" tabindex="0"></div>
	{/if}

	<AppSidebar user={data.user} class={`transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} />

	<!-- Main Content -->
	<main class="md:ml-72 flex-1 relative flex flex-col w-full min-h-screen">
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
