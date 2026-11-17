<script lang="ts">
	import { when } from './format';
	import { isOpen } from './stock';
	import type { Quote } from './yahoo';

	let { quote, now, offline }: { quote: Quote; now: number; offline: boolean } = $props();

	const open = $derived(!offline && isOpen(quote, now));
</script>

<!-- The time is when the exchange gave the price. Yahoo delays some exchanges by 15 minutes. -->
<span class="status" class:open class:offline>
	<span class="dot"></span>
	{offline ? 'Offline' : open ? 'Open' : 'Closed'} · {when(quote.time, now)}
</span>

<style>
	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		min-width: 0;
		overflow: hidden;
		color: var(--muted-foreground);
		font-size: 0.8em;
		white-space: nowrap;
	}

	.dot {
		flex: none;
		width: 0.55em;
		height: 0.55em;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.6;
	}

	.open .dot {
		background: var(--up);
		opacity: 1;
		box-shadow: 0 0 0 0.2em color-mix(in oklch, var(--up) 25%, transparent);
	}

	.offline .dot {
		background: var(--down);
		opacity: 1;
	}
</style>
