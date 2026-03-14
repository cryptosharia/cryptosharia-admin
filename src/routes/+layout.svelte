<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import { onNavigate } from '$app/navigation';
	import NProgress from 'nprogress';
	import 'nprogress/nprogress.css';

	let { children } = $props();

	// Configure NProgress for snappier feel
	NProgress.configure({ 
		showSpinner: false,
		minimum: 0.15,
		trickleSpeed: 100,
		speed: 250
	});

	// View Transition - only apply the visual effect, don't block navigation
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve(); // resolve immediately - don't block network fetch
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

<ModeWatcher defaultMode="dark" />
<div class="antialiased text-foreground bg-background min-h-screen font-sans selection:bg-primary/30">
	{@render children()}
</div>
