<script lang="ts">
	import { page } from '$app/stores';
	import { LayoutDashboard, Coins, Users, MessageSquare, Newspaper, Tag } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	let { user } = $props();

	const navItems = [
		{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ label: 'Posts', href: '/posts', icon: Newspaper },
		{ label: 'Tokens', href: '/tokens', icon: Coins },
		{ label: 'Tags', href: '/tags', icon: Tag },
		{ label: 'Users', href: '/users', icon: Users },
		{ label: 'Messages', href: '/messages', icon: MessageSquare },
	];
</script>

<aside class="fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
	<div class="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
		<a href="/dashboard" class="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
				<img src="/logo.png" alt="CryptoSharia" class="h-6 w-6 object-contain" />
			</div>
			<span>CryptoSharia Admin</span>
		</a>
	</div>

	<div class="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
		<nav class="flex flex-col gap-1" data-sveltekit-preload-data="tap">
			{#each navItems as item}
				{@const active = $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
				<a
					href={item.href}
					class={cn(
						"flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150",
						active ? "bg-orange-500 text-white shadow-md shadow-orange-500/20 font-semibold" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
					)}
				>
					<item.icon class="size-4 flex-shrink-0" />
					{item.label}
				</a>
			{/each}
		</nav>
	</div>

	<div class="border-t border-sidebar-border p-4">
		<div class="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50 mb-2">
			<div class="flex items-center gap-3">
				<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
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
	</div>
</aside>
