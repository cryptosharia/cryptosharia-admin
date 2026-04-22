<script lang="ts">
	import { page } from '$app/stores';
	import { LayoutDashboard, Coins, Users, MessageSquare, Newspaper, Tag, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	let { user, collapsed = $bindable(false), class: className } = $props();

	const navItems = [
		{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ label: 'Posts', href: '/posts', icon: Newspaper },
		{ label: 'Tokens', href: '/tokens', icon: Coins },
		{ label: 'Tags', href: '/tags', icon: Tag },
		{ label: 'Users', href: '/users', icon: Users },
		{ label: 'Messages', href: '/messages', icon: MessageSquare },
	];
</script>

<aside class={cn(
	"fixed inset-y-0 left-0 z-50 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out",
	collapsed ? "w-16" : "w-72",
	className
)}>
	<!-- Header -->
	<div class="flex h-16 items-center border-b border-sidebar-border px-3 shrink-0 relative">
		{#if !collapsed}
			<a href="/dashboard" class="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity overflow-hidden">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
					<img src="/logo.png" alt="CryptoSharia" class="h-6 w-6 object-contain" />
				</div>
				<span class="truncate">CryptoSharia Admin</span>
			</a>
		{:else}
			<a href="/dashboard" class="flex items-center justify-center w-full hover:opacity-80 transition-opacity">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
					<img src="/logo.png" alt="CryptoSharia" class="h-6 w-6 object-contain" />
				</div>
			</a>
		{/if}

		<!-- Collapse toggle button -->
		<button
			onclick={() => collapsed = !collapsed}
			class="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar flex items-center justify-center hover:bg-sidebar-accent transition-colors shadow-sm z-10"
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{#if collapsed}
				<ChevronRight size={12} />
			{:else}
				<ChevronLeft size={12} />
			{/if}
		</button>
	</div>

	<!-- Nav -->
	<div class="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 custom-scrollbar">
		<nav class="flex flex-col gap-1" data-sveltekit-preload-data="tap">
			{#each navItems as item}
				{@const active = $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
				<a
					href={item.href}
					title={collapsed ? item.label : undefined}
					class={cn(
						"flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150",
						collapsed ? "justify-center px-2" : "",
						active
							? "bg-orange-500 text-white shadow-md shadow-orange-500/20 font-semibold"
							: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
					)}
				>
					<item.icon class="size-4 shrink-0" />
					{#if !collapsed}
						<span class="truncate">{item.label}</span>
					{/if}
				</a>
			{/each}
		</nav>
	</div>

	<!-- Footer -->
	<div class="border-t border-sidebar-border p-3 shrink-0">
		{#if !collapsed}
			<div class="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50 mb-2">
				<div class="flex items-center gap-3 min-w-0">
					<div class="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
						{user?.name?.[0] ?? 'A'}
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium leading-none truncate">{user?.name ?? 'Admin'}</p>
						<p class="text-xs text-muted-foreground truncate">{user?.email ?? 'admin@example.com'}</p>
					</div>
				</div>
				<ThemeToggle />
			</div>
			<LogoutButton />
		{:else}
			<div class="flex flex-col items-center gap-2">
				<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold" title={user?.name ?? 'Admin'}>
					{user?.name?.[0] ?? 'A'}
				</div>
				<ThemeToggle />
			</div>
		{/if}
	</div>
</aside>
