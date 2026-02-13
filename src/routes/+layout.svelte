<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import { onNavigate } from '$app/navigation';
	import NProgress from 'nprogress';
	import 'nprogress/nprogress.css';

	let { children } = $props();

	NProgress.configure({ showSpinner: false });

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
	
	import { navigating } from '$app/stores';
	
	$effect(() => {
		if ($navigating) {
			NProgress.start();
		} else {
			NProgress.done();
		}
	});
</script>

<ModeWatcher />
<div class="antialiased text-foreground bg-background min-h-screen font-sans selection:bg-primary/30">
	{@render children()}
</div>
