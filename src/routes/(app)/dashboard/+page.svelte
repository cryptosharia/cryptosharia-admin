<script lang="ts">
	import { TrendingUp, Users, FileText, Activity, ShieldCheck, BookOpen } from 'lucide-svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { fly } from 'svelte/transition';

	let { data } = $props();

	// Skeleton placeholder while streaming
	const skeleton = { tokenCount: 0, userCount: 0, postCount: 0, messageCount: 0, tagCount: 0 };

	const ADMIN_GUIDE_URL = 'https://anything.mdaffailhami.my.id/cryptosharia-admin-guide';
</script>

<div class="space-y-8">
	<!-- Stats Grid -->
	<section>
		<div class="mb-6 flex items-start justify-between gap-4">
			<div>
				<h2 class="text-2xl font-bold tracking-tight">System Overview</h2>
				<p class="mt-1 text-muted-foreground">Real-time metrics from the ecosystem.</p>
			</div>
			<Button
				href={ADMIN_GUIDE_URL}
				variant="outline"
				size="sm"
				target="_blank"
				rel="noopener noreferrer"
				class="shrink-0"
			>
				<BookOpen class="h-4 w-4" />
				<span class="ml-2">Panduan</span>
			</Button>
		</div>

		{#await data.counts}
			<!-- Skeleton while loading -->
			<div class="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
				{#each Array(5) as _}
					<Card class="h-full">
						<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
							<div class="h-4 w-20 animate-pulse rounded bg-muted"></div>
							<div class="h-9 w-9 animate-pulse rounded-lg bg-muted"></div>
						</CardHeader>
						<CardContent>
							<div class="mb-2 h-8 w-16 animate-pulse rounded bg-muted"></div>
							<div class="h-3 w-24 animate-pulse rounded bg-muted"></div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{:then counts}
			{@const stats = [
				{
					label: 'Total Tokens',
					value: counts.tokenCount.toLocaleString(),
					change: 'Tokens tracked',
					icon: TrendingUp
				},
				{
					label: 'Total Users',
					value: counts.userCount.toLocaleString(),
					change: 'Registered users',
					icon: Users
				},
				{
					label: 'Total Posts',
					value: counts.postCount.toLocaleString(),
					change: 'Content published',
					icon: FileText
				},
				{
					label: 'Messages',
					value: counts.messageCount.toLocaleString(),
					change: 'Contact submissions',
					icon: Activity
				},
				{
					label: 'Tags',
					value: counts.tagCount.toLocaleString(),
					change: 'Taxonomy tags',
					icon: ShieldCheck
				}
			]}
			<div class="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
				{#each stats as stat, i}
					<div in:fly={{ y: 20, duration: 400, delay: i * 80 }}>
						<Card
							class="group h-full cursor-default transition-all duration-300 hover:border-orange-500/40"
						>
							<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle
									class="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground"
								>
									{stat.label}
								</CardTitle>
								<div
									class="rounded-lg bg-muted/60 p-2 transition-transform duration-200 group-hover:scale-110"
								>
									<stat.icon
										class="h-5 w-5 text-muted-foreground transition-colors group-hover:text-orange-500"
									/>
								</div>
							</CardHeader>
							<CardContent>
								<div class="mb-1 text-3xl font-bold tracking-tight">{stat.value}</div>
								<p class="text-xs font-medium text-muted-foreground">{stat.change}</p>
							</CardContent>
						</Card>
					</div>
				{/each}
			</div>
		{/await}
	</section>

	<!-- Bottom Row -->
	<section class="grid grid-cols-1 gap-5 lg:grid-cols-3">
		<!-- Recent Activity -->
		<Card class="lg:col-span-2">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Activity class="h-5 w-5 text-orange-500" />
					Recent Activity
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-1">
					{#each [1, 2, 3] as i}
						<div
							class="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
						>
							<div class="flex items-center gap-3">
								<div
									class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 transition-transform group-hover:scale-105"
								>
									<FileText class="h-4 w-4" />
								</div>
								<div>
									<p class="text-sm font-medium">Token Analysis Updated</p>
									<p class="text-xs text-muted-foreground">BTC-2024 Report finalized</p>
								</div>
							</div>
							<span class="text-xs whitespace-nowrap text-muted-foreground">{i * 2}m ago</span>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- System Health -->
		<Card class="border-emerald-500/20">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<ShieldCheck class="h-5 w-5 text-emerald-500" />
					System Health
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex h-44 flex-col items-center justify-center space-y-4">
					<div class="relative">
						<div
							class="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-2xl"
						></div>
						<div
							class="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-500/30 bg-emerald-500/10"
						>
							<span class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">98%</span>
						</div>
					</div>
					<div class="text-center">
						<p class="font-semibold text-foreground">Operational</p>
						<p class="mt-0.5 text-xs text-muted-foreground">All nodes synced</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</section>
</div>
