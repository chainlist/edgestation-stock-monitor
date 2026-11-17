<script lang="ts">
	import Change from './Change.svelte';
	import { compact, priceFormat } from './format';
	import Head from './Head.svelte';
	import RangeBar from './RangeBar.svelte';
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
	/** The figures that Yahoo gives for this stock. An exchange rate has no volume, for exemple. */
	const stats = $derived(
		[
			['Open', quote.open === undefined ? undefined : price(quote.open)],
			['Previous close', price(quote.previousClose)],
			['Volume', quote.volume === undefined ? undefined : compact(quote.volume)],
			['Exchange', quote.exchange || stock.exchange]
		].filter((stat): stat is [string, string] => !!stat[1])
	);
</script>

<div class="view">
	<Head {stock} {onedit} />
	<div class="summary">
		<span class="price">{price(quote.price)}</span>
		<Change from={quote.previousClose} to={quote.price} decimals={quote.decimals} />
		<span class="aside"><Status {quote} {now} {offline} /></span>
	</div>
	<dl class="stats">
		{#each stats as [label, value] (label)}
			<div>
				<dt>{label}</dt>
				<dd>{value}</dd>
			</div>
		{/each}
	</dl>
	<div class="bars">
		{#if quote.dayLow !== undefined && quote.dayHigh !== undefined}
			<RangeBar
				label="Day"
				low={quote.dayLow}
				high={quote.dayHigh}
				value={quote.price}
				format={price}
			/>
		{/if}
		{#if quote.yearLow !== undefined && quote.yearHigh !== undefined}
			<RangeBar
				label="52 weeks"
				low={quote.yearLow}
				high={quote.yearHigh}
				value={quote.price}
				format={price}
			/>
		{/if}
	</div>
</div>

<style>
	/* The price stays under the name. The free height goes above the figures and the bars. */
	.view {
		display: flex;
		flex-direction: column;
		gap: 0.7em;
		height: 100%;
		overflow: hidden;
	}

	.summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3em 0.7em;
	}

	.summary .price {
		font-size: 1.9em;
	}

	.aside {
		display: flex;
		flex: 1;
		justify-content: flex-end;
		min-width: max-content;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7em, 1fr));
		gap: 0.6em 1.2em;
		margin: auto 0 0;
	}

	dt {
		color: var(--muted-foreground);
		font-size: 0.75em;
		white-space: nowrap;
	}

	dd {
		margin: 0.15em 0 0;
		overflow: hidden;
		font-weight: 600;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-variant-numeric: tabular-nums;
	}

	.bars {
		display: grid;
		grid-template-columns: auto auto minmax(3em, 1fr) auto;
		align-items: center;
		gap: 0.7em 0.8em;
		margin-top: auto;
	}
</style>
