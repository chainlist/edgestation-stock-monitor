<script lang="ts">
	import type { Cleanup, WidgetApi } from '@edgestation/sdk';
	import Icon from './Icon.svelte';
	import type { Stock } from './stock';
	import { search, type Listing } from './yahoo';

	let {
		api,
		current,
		onapply,
		oncancel
	}: {
		api: WidgetApi;
		/** The stock that the placement shows, if any. */
		current: Stock | null;
		onapply: (stock: Stock) => void;
		/** Leaves the setup with no change. There is none on the first setup. */
		oncancel?: () => void;
	} = $props();

	// The setup starts from the saved stock, and is a draft until Apply.
	// svelte-ignore state_referenced_locally
	let picked = $state.raw<Listing | undefined>(current ?? undefined);
	let term = $state('');
	let results = $state.raw<Listing[]>([]);
	let phase = $state<'idle' | 'searching' | 'failed'>('idle');
	let wait: Cleanup | undefined;
	/** Counts the searches, so that an older answer cannot replace a newer one. */
	let latest = 0;

	/** The pick stays on top of the results, so Apply never aplies a stock that is not shown. */
	const rows = $derived(
		picked && !results.some((found) => found.symbol === picked!.symbol)
			? [picked, ...results]
			: results
	);

	function oninput() {
		wait?.();
		const text = term.trim();
		const mine = ++latest;
		if (!text) {
			results = [];
			phase = 'idle';
			return;
		}
		phase = 'searching';
		// The search starts 300 ms after the last key.
		wait = api.after(300, async () => {
			try {
				const found = await search(api, text);
				if (mine === latest) [results, phase] = [found, 'idle'];
			} catch {
				if (mine === latest) phase = 'failed';
			}
		});
	}

	function apply() {
		if (picked) onapply({ ...picked, range: current?.range ?? '1D' });
	}
</script>

<div class="setup">
	<label class="search">
		<Icon name="search" />
		<input
			bind:value={term}
			{oninput}
			placeholder="Search a company, fund, index or crypto"
			aria-label="Search a stock"
			enterkeyhint="search"
			onkeydown={(event) => event.key === 'Escape' && oncancel?.()}
		/>
	</label>

	{#if rows.length}
		<!-- This holds the overlay scrollbars of the results. -->
		<div class="list">
			<ul class="results" {@attach (ul) => api.scrollbars(ul)}>
				{#each rows as listing (listing.symbol)}
					{@const chosen = listing.symbol === picked?.symbol}
					<li>
						<button
							class="result"
							class:chosen
							aria-pressed={chosen}
							onclick={() => (picked = listing)}
						>
							<span class="symbol">{listing.symbol}</span>
							<span class="name">{listing.name}</span>
							<span class="where"
								>{[listing.exchange, listing.kind].filter(Boolean).join(' · ')}</span
							>
							<span class="tick"
								>{#if chosen}<Icon name="check" />{/if}</span
							>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{:else}
		<p class="note">
			{phase === 'failed'
				? "Couldn't reach Yahoo Finance. Type again to retry."
				: phase === 'searching'
					? 'Searching…'
					: term.trim()
						? 'Nothing found.'
						: 'Type a name or a symbol, such as Apple, AAPL, S&P 500 or Bitcoin.'}
		</p>
	{/if}

	<footer class="actions">
		{#if oncancel}<button class="pill" onclick={oncancel}>Cancel</button>{/if}
		<button class="pill primary" disabled={!picked} onclick={apply}>Apply</button>
	</footer>
</div>

<style>
	.setup {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.6em;
		min-height: 0;
	}

	.search {
		display: flex;
		flex: none;
		align-items: center;
		gap: 0.5em;
		height: max(2.4em, 38px);
		padding: 0 0.8em;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 0.75);
		color: var(--muted-foreground);
	}

	.search:focus-within {
		border-color: var(--ring);
	}

	input {
		flex: 1;
		min-width: 0;
		height: 100%;
		padding: 0;
		border: none;
		outline: none;
		background: transparent;
		color: var(--card-foreground);
		font: inherit;
	}

	input::placeholder {
		color: var(--muted-foreground);
	}

	/* It holds the overlay scrollbars of `.results`. */
	.list {
		flex: 1;
		min-height: 0;
	}

	.results {
		margin: 0;
		padding: 0;
		overscroll-behavior: contain;
		list-style: none;
	}

	/* A finger needs about 34 px. The rows, buttons and choices are a bit higher. */
	.result {
		display: grid;
		grid-template-columns: minmax(4.5em, auto) minmax(0, 1fr) auto 1.4em;
		align-items: center;
		gap: 0.8em;
		width: 100%;
		min-height: max(2.6em, 38px);
		padding: 0 0.8em;
		border-radius: calc(var(--radius) * 0.75);
		text-align: left;
	}

	.result:active,
	.result.chosen {
		background: color-mix(in oklch, var(--card-foreground) 9%, transparent);
	}

	.result.chosen {
		box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--primary) 60%, transparent);
	}

	.symbol {
		font-weight: 700;
	}

	.name,
	.where {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	/* Some exchange names are long, such as "Chicago Mercantile Exchange". */
	.where {
		max-width: 14em;
		color: var(--muted-foreground);
		font-size: 0.8em;
	}

	.tick {
		display: grid;
		place-items: center;
		color: var(--primary);
	}

	.note {
		flex: 1;
		margin: 0;
		align-content: center;
		color: var(--muted-foreground);
		text-align: center;
	}

	.actions {
		display: flex;
		flex: none;
		justify-content: flex-end;
		gap: 0.5em;
	}

	.pill {
		height: max(2.4em, 38px);
	}

	.pill:disabled {
		opacity: 0.45;
		cursor: default;
	}

	/* A narrow cell keeps the rows readable: the exchange goes. */
	@container (width < 480px) {
		.where {
			display: none;
		}

		.result {
			grid-template-columns: minmax(4em, auto) minmax(0, 1fr) 1.4em;
		}
	}
</style>
