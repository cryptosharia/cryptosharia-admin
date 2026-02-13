<script lang="ts">
	import '../layout.css';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	
	let { children, data } = $props();
</script>

<div class="flex min-h-screen bg-background text-foreground font-sans">
	<AppSidebar user={data.admin} />

	<!-- Main Content -->
	<main class="ml-72 flex-1 min-h-screen relative flex flex-col">
		<!-- Optional: Top Header for mobile toggle or breadcrumbs could go here -->
		<!-- For now, we keep it clean as per Shadcn Dashboard -->
		
		<div class="flex-1 p-8 pt-6 space-y-4">
			{@render children()}
		</div>
	</main>
</div>
