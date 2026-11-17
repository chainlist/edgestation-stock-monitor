<script lang="ts">
	import Icon from './Icon.svelte';
	import type { Stock } from './stock';

	let { stock, onedit }: { stock: Stock; onedit: () => void } = $props();
</script>

<header class="head">
	<span class="symbol">{stock.symbol}</span>
	<span class="name">{stock.name}</span>
	<button class="edit" onclick={onedit} aria-label="Change the stock">
		<Icon name="edit" />
	</button>
</header>

<style>
	.head {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
		line-height: 1.2;
	}

	.symbol {
		flex: none;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		color: var(--muted-foreground);
		font-size: 0.85em;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	/* The negative margins make the button easy to touch, and keep the row low. */
	.edit {
		display: grid;
		flex: none;
		place-items: center;
		width: max(2.4em, 34px);
		height: max(2.4em, 34px);
		margin: -0.7em -0.7em -0.7em 0;
		border-radius: 50%;
		color: var(--muted-foreground);
		font-size: 0.9em;
	}

	.edit:active {
		background: color-mix(in oklch, var(--card-foreground) 10%, transparent);
	}
</style>
