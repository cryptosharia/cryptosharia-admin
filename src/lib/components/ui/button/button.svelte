<script lang="ts">
	import { type VariantProps, cva } from 'class-variance-authority';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	const buttonVariants = cva(
		'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		{
			variants: {
				variant: {
					default:
						'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md border-none',
					destructive:
						'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
					outline:
						'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground backdrop-blur-sm',
					secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
					ghost: 'hover:bg-accent hover:text-accent-foreground',
					link: 'text-primary underline-offset-4 hover:underline'
				},
				size: {
					default: 'h-10 px-6 py-2',
					sm: 'h-9 rounded-md px-3',
					lg: 'h-12 rounded-lg px-8 text-base',
					icon: 'h-10 w-10'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	type AnchorProps = HTMLAnchorAttributes &
		VariantProps<typeof buttonVariants> & {
			href: string;
		};

	type ButtonProps = HTMLButtonAttributes &
		VariantProps<typeof buttonVariants> & {
			href?: undefined;
		};

	type Props = AnchorProps | ButtonProps;

	let { class: className, variant, size, href, children, ...props }: Props = $props();
</script>

{#if href}
	<a {href} class={cn(buttonVariants({ variant, size, className }))} {...props as any}>
		{@render children?.()}
	</a>
{:else}
	<button class={cn(buttonVariants({ variant, size, className }))} {...props as any}>
		{@render children?.()}
	</button>
{/if}
