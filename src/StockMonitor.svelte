<script lang="ts">
	import type { WidgetApi } from '@edgestation/sdk';
	import ChartView from './ChartView.svelte';
	import DetailsView from './DetailsView.svelte';
	import PriceView from './PriceView.svelte';
	import Setup from './Setup.svelte';
	import { nextLoad, PERIOD, rangeOf, type Show, type Stock } from './stock';
	import { Missing, quote as loadQuote, type Quote, type Range } from './yahoo';

	let props: { api: WidgetApi } = $props();
	// `api` does not change. A changed setting mounts the widget again.
	// svelte-ignore state_referenced_locally
	const { api } = props;
	const show = api.settings.show as Show;

	/** `undefined` until the widget reads the saved stock. `null` if there is none. */
	let stock = $state.raw<Stock | null>();
	let editing = $state(false);
	let quote = $state.raw<Quote>();
	/** Why the last load failed. A quote from before stays on the screen. */
	let failure = $state<'offline' | 'missing' | null>(null);
	let now = $state(Date.now());
	/** When the next load is due, in milliseconds. */
	let due = Infinity;
	/** Counts the loads, so that an older answer cannot replace a newer one. */
	let latest = 0;

	async function load() {
		if (!stock) return;
		const mine = ++latest;
		due = Infinity;
		try {
			const found = await loadQuote(api, stock.symbol, rangeOf(stock, show));
			if (mine !== latest) return;
			[quote, failure, now] = [found, null, Date.now()];
			due = nextLoad(found.session, now);
		} catch (error) {
			if (mine !== latest) return;
			console.warn('Stock monitor:', error);
			failure = error instanceof Missing ? 'missing' : 'offline';
			due = Date.now() + PERIOD;
		}
	}

	/** Loads now. The card shows its loading bar. */
	const reload = () => api.loading(load());

	api.guard(() =>
		api.loading(
			(async () => {
				stock = (await api.storage.instance.get<Stock>('stock')) ?? null;
				await load();
			})()
		)
	)();

	// `every` also ticks each time the page shows again, so a load that came due off screen runs.
	api.every(60_000, () => {
		now = Date.now();
		if (!editing && now >= due) void reload();
	});

	const save = api.guard(async (next: Stock) => {
		stock = next;
		await api.storage.instance.set('stock', next);
	});

	function apply(next: Stock) {
		const old = stock;
		editing = false;
		void save(next);
		if (old?.symbol !== next.symbol) {
			[quote, failure] = [undefined, null];
			void reload();
		}
	}

	/** Keeps the chart of the old range until the new one comes. */
	function setRange(range: Range) {
		if (!stock || stock.range === range) return;
		void save({ ...stock, range });
		void reload();
	}

	const edit = () => (editing = true);
</script>

<!-- `el` is the size container, so its padding cannot use cqh or cqw. Put the layout in it. -->
<div class="stock">
	{#if stock === null || (stock && editing)}
		<Setup
			{api}
			current={stock}
			onapply={apply}
			oncancel={stock ? () => (editing = false) : undefined}
		/>
	{:else if stock && quote && failure !== 'missing'}
		{@const offline = failure === 'offline'}
		{#if show === 'chart'}
			<ChartView {stock} {quote} {now} {offline} onrange={setRange} onedit={edit} />
		{:else if show === 'details'}
			<DetailsView {stock} {quote} {now} {offline} onedit={edit} />
		{:else}
			<PriceView {stock} {quote} {now} {offline} onedit={edit} />
		{/if}
	{:else if stock && failure}
		<div class="message">
			<p class="title">{failure === 'missing' ? `No data for ${stock.symbol}` : 'No prices'}</p>
			<p>
				{failure === 'missing'
					? 'Yahoo Finance has no prices for it. It may be delisted.'
					: "Yahoo Finance can't be reached. Trying again in 5 minutes."}
			</p>
			<div class="buttons">
				<button class="pill" onclick={edit}>Change stock</button>
				{#if failure === 'offline'}<button class="pill primary" onclick={reload}>Try again</button
					>{/if}
			</div>
		</div>
	{:else if stock}
		<p class="message">Loading {stock.symbol}…</p>
	{/if}
</div>

<style>
	/* The font follows the height of the cell, and the width of a narrow one, with limits that
	   keep the text readable. */
	.stock {
		--up: color-mix(in oklch, oklch(0.72 0.19 150) 85%, var(--card-foreground));
		--down: color-mix(in oklch, oklch(0.66 0.21 25) 85%, var(--card-foreground));
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 0.9em 1em;
		font-size: clamp(13px, min(5cqh, 4cqw), 22px);
	}

	/* The rest is shared with the other components. */
	:where(.stock) :global(button) {
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	:where(.stock) :global(.pill) {
		flex: none;
		padding: 0 1.1em;
		border-radius: 999px;
		background: color-mix(in oklch, var(--card-foreground) 10%, transparent);
		white-space: nowrap;
	}

	:where(.stock) :global(.pill.primary) {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	:where(.stock) :global(.price) {
		font-weight: 650;
		line-height: 1;
		letter-spacing: -0.01em;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.message {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6em;
		text-align: center;
		color: var(--muted-foreground);
	}

	.message p {
		margin: 0;
	}

	.message .title {
		color: var(--card-foreground);
		font-size: 1.15em;
		font-weight: 600;
	}

	.message .buttons {
		display: flex;
		gap: 0.5em;
		margin-top: 0.4em;
	}

	.message .pill {
		height: max(2.4em, 34px);
	}
</style>
