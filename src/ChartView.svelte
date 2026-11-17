<script lang="ts">
	import Change from './Change.svelte';
	import Chart from './Chart.svelte';
	import { pointTime, priceFormat } from './format';
	import Head from './Head.svelte';
	import Status from './Status.svelte';
	import type { Stock } from './stock';
	import { RANGES, type Quote, type Range } from './yahoo';

	let {
		stock,
		quote,
		now,
		offline,
		onrange,
		onedit
	}: {
		stock: Stock;
		quote: Quote;
		now: number;
		offline: boolean;
		onrange: (range: Range) => void;
		onedit: () => void;
	} = $props();

	/** The point under the finger. */
	let scrubbed = $state<number | null>(null);

	const price = $derived(priceFormat(quote));
	const point = $derived(scrubbed === null ? undefined : quote.points[scrubbed]);
	const day = $derived(quote.range === '1D');
	/** The change of the day is from the previous close, and the change of a range from its start. */
	const from = $derived(day ? quote.previousClose : quote.base);
</script>

<div class="view">
	<Head {stock} {onedit} />
	<div class="summary">
		<span class="price">{price(point?.price ?? quote.price)}</span>
		<Change {from} to={point?.price ?? quote.price} decimals={quote.decimals} />
		<span class="aside">
			{#if point}
				<span class="time">{pointTime(quote.range, point.time)}</span>
			{:else}
				<Status {quote} {now} {offline} />
			{/if}
		</span>
	</div>
	<Chart
		points={quote.points}
		base={day ? quote.previousClose : undefined}
		span={quote.span}
		up={quote.price >= from}
		onscrub={(index) => (scrubbed = index)}
	/>
	<div class="ranges" role="radiogroup" aria-label="Range">
		{#each RANGES as range (range)}
			<button
				class="range"
				role="radio"
				aria-checked={stock.range === range}
				onclick={() => onrange(range)}>{range}</button
			>
		{/each}
	</div>
</div>

<style>
	.view {
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr) auto;
		gap: 0.7em;
		height: 100%;
	}

	.summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3em 0.7em;
		min-width: 0;
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

	.time {
		color: var(--card-foreground);
		font-size: 0.85em;
		font-weight: 600;
		white-space: nowrap;
	}

	.ranges {
		display: flex;
		gap: 0.3em;
	}

	/* A finger needs about 34 px. The chips shrink in a narrow cell, but keep this height. */
	.range {
		flex: 0 1 3.6em;
		height: max(2.3em, 34px);
		border-radius: 999px;
		color: var(--muted-foreground);
		font-size: 0.85em;
		font-weight: 600;
	}

	.range[aria-checked='true'] {
		background: color-mix(in oklch, var(--card-foreground) 13%, transparent);
		color: var(--card-foreground);
	}
</style>
