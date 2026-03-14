<script lang="ts">
	import { ArrowLeft, Mail, Clock, Calendar } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';

	let { data } = $props();
	const msg = data.message;
</script>

<div class="space-y-6 max-w-4xl mx-auto">
	<div class="flex items-center gap-4">
		<Button href="/messages" variant="outline" size="icon" class="rounded-full">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Message Details</h1>
			<p class="text-muted-foreground">View full content of the contact form submission.</p>
		</div>
	</div>

	<Card>
		<CardHeader class="pb-4">
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xl flex-shrink-0">
						{msg.name?.[0]?.toUpperCase() ?? '?'}
					</div>
					<div>
						<CardTitle class="text-xl">{msg.name}</CardTitle>
						<a
							href="mailto:{msg.email}"
							class="text-sm text-primary hover:underline flex items-center gap-1.5 mt-1"
						>
							<Mail size={14} />
							{msg.email}
						</a>
					</div>
				</div>
				<div class="text-right flex flex-col items-end text-sm text-muted-foreground">
					<div class="flex items-center gap-1.5 pt-1">
						<Calendar size={14} />
						{new Date(msg.createdAt).toLocaleDateString('id-ID', {
							weekday: 'long',
							day: 'numeric',
							month: 'long',
							year: 'numeric'
						})}
					</div>
					<div class="flex items-center gap-1.5 mt-1 pt-1">
						<Clock size={14} />
						{new Date(msg.createdAt).toLocaleTimeString('id-ID', {
							hour: '2-digit',
							minute: '2-digit'
						})}
					</div>
				</div>
			</div>
		</CardHeader>
		
		<Separator />
		
		<CardContent class="pt-6">
			<div class="bg-muted/30 rounded-lg p-6 border border-border">
				<p class="whitespace-pre-wrap leading-relaxed text-foreground/90">{msg.message}</p>
			</div>
			
			<div class="mt-8 flex gap-3">
				<Button href="mailto:{msg.email}" class="gap-2">
					<Mail size={16} />
					Reply via Email
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
