<script lang="ts">
	import { page } from '$app/stores';
	import {
		LayoutDashboard,
		Coins,
		Users,
		MessageSquare,
		Newspaper,
		Tag,
		ChevronLeft,
		ChevronRight,
		BookOpen
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	let { user, collapsed = $bindable(false), class: className } = $props();

	const ADMIN_GUIDE_URL = 'https://anything.mdaffailhami.my.id/cryptosharia-admin-guide';

	const navItems = [
		{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ label: 'Posts', href: '/posts', icon: Newspaper },
		{ label: 'Tokens', href: '/tokens', icon: Coins },
		{ label: 'Tags', href: '/tags', icon: Tag },
		{ label: 'Users', href: '/users', icon: Users },
		{ label: 'Messages', href: '/messages', icon: MessageSquare }
	];

	const helpItems = [{ label: 'Panduan', href: ADMIN_GUIDE_URL, icon: BookOpen, external: true }];
</script>

<aside
	class={cn(
		'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
		collapsed ? 'w-16' : 'w-72',
		className
	)}
>
	<!-- Header -->
	<div class="relative flex h-16 shrink-0 items-center border-b border-sidebar-border px-3">
		{#if !collapsed}
			<a
				href="/dashboard"
				class="flex items-center gap-2 overflow-hidden text-xl font-bold transition-opacity hover:opacity-80"
			>
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
					<img src="/logo.png" alt="CryptoSharia" class="h-6 w-6 object-contain" />
				</div>
				<span class="truncate">CryptoSharia Admin</span>
			</a>
		{:else}
			<a
				href="/dashboard"
				class="flex w-full items-center justify-center transition-opacity hover:opacity-80"
			>
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
					<img src="/logo.png" alt="CryptoSharia" class="h-6 w-6 object-contain" />
				</div>
			</a>
		{/if}

		<!-- Collapse toggle button -->
		<button
			onclick={() => (collapsed = !collapsed)}
			class="absolute top-1/2 -right-3 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-sidebar-border bg-sidebar shadow-sm transition-colors hover:bg-sidebar-accent"
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
	<div class="custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-2 py-4">
		<nav class="flex flex-col gap-1" data-sveltekit-preload-data="tap">
			{#each navItems as item}
				{@const active =
					$page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
				<a
					href={item.href}
					title={collapsed ? item.label : undefined}
					class={cn(
						'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
						collapsed ? 'justify-center px-2' : '',
						active
							? 'bg-orange-500 font-semibold text-white shadow-md shadow-orange-500/20'
							: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
					)}
				>
					<item.icon class="size-4 shrink-0" />
					{#if !collapsed}
						<span class="truncate">{item.label}</span>
					{/if}
				</a>
			{/each}

			<div class="my-3 border-t border-sidebar-border/60"></div>

			{#each helpItems as item}
				<a
					href={item.href}
					target={item.external ? '_blank' : undefined}
					rel={item.external ? 'noopener noreferrer' : undefined}
					title={collapsed ? item.label : undefined}
					class={cn(
						'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
						collapsed ? 'justify-center px-2' : '',
						'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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
	<div class="shrink-0 border-t border-sidebar-border p-3">
		{#if !collapsed}
			<div class="mb-2 flex items-center justify-between rounded-lg bg-sidebar-accent/50 p-2">
				<div class="flex min-w-0 items-center gap-3">
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary"
					>
						{user?.name?.[0] ?? 'A'}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm leading-none font-medium">{user?.name ?? 'Admin'}</p>
						<p class="truncate text-xs text-muted-foreground">
							{user?.email ?? 'admin@example.com'}
						</p>
					</div>
				</div>
				<ThemeToggle />
			</div>
			<LogoutButton />
		{:else}
			<div class="flex flex-col items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary"
					title={user?.name ?? 'Admin'}
				>
					{user?.name?.[0] ?? 'A'}
				</div>
				<ThemeToggle />
			</div>
		{/if}
	</div>
</aside>
