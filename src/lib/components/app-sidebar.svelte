<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import {
		LayoutDashboard,
		Coins,
		Users,
		MessageSquare,
		Newspaper,
		Tag,
		ChevronLeft,
		ChevronRight,
		BookOpen,
		UsersRound,
		GraduationCap,
		CheckSquare,
		Layers,
		KeyRound,
		Settings
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { canManageCryptoassets, canManageAcademy } from '$lib/permissions';

	let { user, collapsed = $bindable(false), class: className } = $props();

	interface NavGroup {
		title: string;
		items: {
			label: string;
			href: string;
			icon: any;
			badge?: string;
			condition?: boolean;
		}[];
	}

	const canManageTokens = $derived(canManageCryptoassets(user?.role));
	const canAccessAcademy = $derived(canManageAcademy(user?.role));

	const navGroups = $derived<NavGroup[]>([
		{
			title: 'Overview',
			items: [
				{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
				{
					label: 'Ringkasan Academy',
					href: '/academy/overview',
					icon: GraduationCap,
					condition: canAccessAcademy
				}
			]
		},
		{
			title: 'Content & Screening',
			items: [
				{ label: 'Artikel & Berita', href: '/posts', icon: Newspaper },
				{
					label: 'Token Kripto',
					href: '/tokens',
					icon: Coins,
					condition: canManageTokens
				},
				{ label: 'Kategori / Tags', href: '/tags', icon: Tag },
				{ label: 'Pesan Masuk', href: '/messages', icon: MessageSquare }
			]
		},
		{
			title: 'Academy CMS',
			items: [
				{
					label: 'Kurikulum & Editor',
					href: '/academy/courses',
					icon: BookOpen,
					condition: canAccessAcademy
				},
				{
					label: 'Editorial & Review',
					href: '/academy/editorial',
					icon: CheckSquare,
					condition: canAccessAcademy
				},
				{
					label: 'Scope Akses',
					href: '/academy/scopes',
					icon: Layers,
					condition: canAccessAcademy
				},
				{
					label: 'Hak Akses Siswa',
					href: '/academy/grants',
					icon: KeyRound,
					condition: canAccessAcademy
				}
			]
		},
		{
			title: 'Operasional',
			items: [
				{ label: 'Tim Kami', href: '/team', icon: UsersRound },
				{ label: 'Daftar Pengguna', href: '/users', icon: Users },
				{ label: 'Pengaturan', href: '/settings', icon: Settings }
			]
		}
	]);
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
				href={resolve('/dashboard')}
				class="flex items-center gap-2.5 overflow-hidden text-base font-bold transition-opacity hover:opacity-85"
			>
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
					<img src="/logo.png" alt="CryptoSharia" class="h-5 w-5 object-contain" />
				</div>
				<div class="flex flex-col min-w-0">
					<span class="truncate text-sm font-bold tracking-tight">CryptoSharia</span>
					<span class="text-[10px] font-medium text-orange-500 tracking-wider uppercase">Unified Admin</span>
				</div>
			</a>
		{:else}
			<a
				href={resolve('/dashboard')}
				class="flex w-full items-center justify-center transition-opacity hover:opacity-85"
			>
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
					<img src="/logo.png" alt="CryptoSharia" class="h-5 w-5 object-contain" />
				</div>
			</a>
		{/if}

		<!-- Collapse toggle button -->
		<button
			onclick={() => (collapsed = !collapsed)}
			class="absolute top-1/2 -right-3 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-sidebar-border bg-sidebar shadow-sm transition-colors hover:bg-sidebar-accent"
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			aria-label={collapsed ? 'Perluas bilah samping' : 'Ciutkan bilah samping'}
		>
			{#if collapsed}
				<ChevronRight size={12} />
			{:else}
				<ChevronLeft size={12} />
			{/if}
		</button>
	</div>

	<!-- Nav Groups -->
	<div class="custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-2 py-3">
		<nav class="flex flex-col gap-4" data-sveltekit-preload-data="tap">
			{#each navGroups as group}
				{@const activeItems = group.items.filter((item) => item.condition !== false)}
				{#if activeItems.length > 0}
					<div class="space-y-1">
						{#if !collapsed}
							<div class="px-3 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
								{group.title}
							</div>
						{:else}
							<div class="my-1 border-t border-sidebar-border/40"></div>
						{/if}

						{#each activeItems as item (item.href)}
							{@const active = $page.url.pathname === item.href || ($page.url.pathname.startsWith(item.href + '/') && item.href !== '/dashboard')}
							<a
								href={resolve(item.href as any)}
								title={collapsed ? item.label : undefined}
								class={cn(
									'group flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150',
									collapsed ? 'justify-center px-2' : '',
									active
										? 'bg-orange-500 font-semibold text-white shadow-sm shadow-orange-500/20'
										: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
								)}
							>
								<item.icon class="size-4 shrink-0 transition-transform group-hover:scale-105" />
								{#if !collapsed}
									<span class="truncate flex-1">{item.label}</span>
									{#if item.badge}
										<span class="ml-auto rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-500">
											{item.badge}
										</span>
									{/if}
								{/if}
							</a>
						{/each}
					</div>
				{/if}
			{/each}

			<div class="my-2 border-t border-sidebar-border/60"></div>

			<a
				href="https://anything.mdaffailhami.my.id/cryptosharia-admin-guide"
				target="_blank"
				rel="noopener noreferrer"
				title={collapsed ? 'Panduan Admin' : undefined}
				class={cn(
					'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150',
					collapsed ? 'justify-center px-2' : '',
					'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
				)}
			>
				<BookOpen class="size-4 shrink-0" />
				{#if !collapsed}
					<span class="truncate">Dokumentasi & Panduan</span>
				{/if}
			</a>
		</nav>
	</div>

	<!-- Footer -->
	<div class="shrink-0 border-t border-sidebar-border p-3">
		{#if !collapsed}
			<div class="mb-2 flex items-center justify-between rounded-lg bg-sidebar-accent/50 p-2">
				<div class="flex min-w-0 items-center gap-2.5">
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 font-bold text-orange-500 border border-orange-500/20 text-xs"
					>
						{user?.name?.[0]?.toUpperCase() ?? 'A'}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-xs font-semibold leading-tight text-foreground">{user?.name ?? 'Admin'}</p>
						<p class="truncate text-[10px] text-muted-foreground">
							{user?.email ?? 'admin@cryptosharia.id'}
						</p>
					</div>
				</div>
				<ThemeToggle />
			</div>
			<LogoutButton />
		{:else}
			<div class="flex flex-col items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 font-bold text-orange-500 border border-orange-500/20 text-xs"
					title={user?.name ?? 'Admin'}
				>
					{user?.name?.[0]?.toUpperCase() ?? 'A'}
				</div>
				<ThemeToggle />
			</div>
		{/if}
	</div>
</aside>
