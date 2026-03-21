<script lang="ts">
	import { ArrowLeft, Mail, Clock, Calendar, User, MessageSquare, Reply } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';

	let { data } = $props();
	let msg = $derived(data.message);
</script>

<div class="space-y-6 max-w-5xl mx-auto">
	<div class="flex items-center gap-4">
		<Button href="/messages" variant="outline" size="icon" class="rounded-full shadow-sm hover:shadow-md transition-all">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Message Details</h1>
			<p class="text-muted-foreground mt-1">Full content of the contact form submission.</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Message Content -->
		<div class="lg:col-span-2 space-y-6">
			<Card class="border-none shadow-xl bg-gradient-to-b from-card to-card/50">
				<CardHeader class="pb-2">
					<CardTitle class="flex items-center gap-2 text-primary">
						<MessageSquare size={18} />
						Submission Content
					</CardTitle>
				</CardHeader>
				<CardContent class="pt-4">
					<div class="bg-muted/30 rounded-2xl p-8 border border-border/50 shadow-inner min-h-[300px]">
						<p class="whitespace-pre-wrap leading-relaxed text-lg text-foreground/90 font-serif italic">
							"{msg.message}"
						</p>
					</div>
					
					<div class="mt-8 flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
						<div class="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
							<Reply size={20} />
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-foreground">Next Action</p>
							<p class="text-xs text-muted-foreground">Reach out to the sender via their provided email address.</p>
						</div>
						<Button href="mailto:{msg.email}" class="gap-2 shadow-lg shadow-primary/20">
							<Mail size={16} />
							Reply Now
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Sender Sidebar -->
		<div class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
						<User size={12} /> Contact Information
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="flex items-center gap-4 pb-2">
						<div class="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-2xl flex-shrink-0 shadow-sm">
							{msg.name?.[0]?.toUpperCase() ?? '?'}
						</div>
						<div class="overflow-hidden">
							<p class="font-bold text-xl truncate">{msg.name}</p>
							<a
								href="mailto:{msg.email}"
								class="text-sm text-primary hover:underline flex items-center gap-1.5 mt-1 truncate"
							>
								{msg.email}
							</a>
						</div>
					</div>

					<Separator />

					<div class="space-y-4">
						<div class="flex items-start gap-3 group">
							<div class="h-8 w-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
								<Calendar size={14} />
							</div>
							<div>
								<p class="text-[10px] font-bold uppercase text-muted-foreground leading-none">Received Date</p>
								<p class="text-sm font-medium mt-1">
									{new Date(msg.createdAt).toLocaleDateString('id-ID', {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}
								</p>
							</div>
						</div>

						<div class="flex items-start gap-3 group">
							<div class="h-8 w-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
								<Clock size={14} />
							</div>
							<div>
								<p class="text-[10px] font-bold uppercase text-muted-foreground leading-none">Received Time</p>
								<p class="text-sm font-medium mt-1">
									{new Date(msg.createdAt).toLocaleTimeString('id-ID', {
										hour: '2-digit',
										minute: '2-digit'
									})}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card class="bg-muted/20 border-dashed">
				<CardContent class="p-6 text-center">
					<p class="text-xs text-muted-foreground">
						This message was sent via the <strong>Contact Us</strong> form on the public website.
					</p>
				</CardContent>
			</Card>
		</div>
	</div>
</div>

