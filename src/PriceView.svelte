<script lang="ts">
	import Change from './Change.svelte';
	import Chart from './Chart.svelte';
	import { priceFormat } from './format';
	import Head from './Head.svelte';
	import Status from './Status.svelte';
	import type { Stock } from './stock';
	import type { Quote } from './yahoo';

	let {
		stock,
		quote,
		now,
		offline,
		onedit
	}: { stock: Stock; quote: Quote; now: number; offline: boolean; onedit: () => void } = $props();

	const price = $derived(priceFormat(quote));
</script>

<div class="view">
	<Head {stock} {onedit} />
	<div class="body">
		<div class="numbers">
			<span class="price">{price(quote.price)}</span>
			<span class="line">
				<Change from={quote.previousClose} to={quote.price} decimals={quote.decimals} />
				<Status {quote} {now} {offline} />
			</span>
		</div>
		<Chart
			points={quote.points}
			base={quote.previousClose}
			span={quote.span}
			up={quote.price >= quote.previousClose}
		/>
	</div>
</div>

<style>
	.view {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		gap: 0.7em;
		height: 100%;
	}

	/* The chart of the day is under the numbers, or next to them in a wide cell. */
	.body {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		gap: 1em;
		min-height: 0;
	}

	.numbers {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.6em;
		min-width: 0;
	}

	.numbers .price {
		font-size: clamp(1.8em, min(16cqh, 10cqw), 5em);
	}

	.line {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4em 0.8em;
	}

	@container (aspect-ratio > 1.4) {
		.body {
			grid-template-rows: minmax(0, 1fr);
			grid-template-columns: auto minmax(0, 1fr);
			gap: 1.6em;
		}

		.body > :global(.chart) {
			margin: 0.8em 0;
		}
	}
</style>
