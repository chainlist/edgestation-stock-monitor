<script lang="ts">
	import { changeFormat, percent } from './format';

	let { from, to, decimals }: { from: number; to: number; decimals: number } = $props();

	const change = $derived(to - from);
	const format = $derived(changeFormat(decimals));
</script>

<span class="change" class:down={change < 0}>
	<svg viewBox="0 0 10 10" aria-hidden="true">
		<path d={change < 0 ? 'M5 8.5 9.5 2h-9z' : 'M5 1.5 9.5 8h-9z'} />
	</svg>
	{format(change)}{#if from}<span class="percent">{percent(change / from)}</span>{/if}
</span>

<style>
	.change {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 0.35em;
		padding: 0.2em 0.6em;
		border-radius: 999px;
		background: color-mix(in oklch, var(--up) 16%, transparent);
		color: var(--up);
		font-weight: 600;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.change.down {
		background: color-mix(in oklch, var(--down) 16%, transparent);
		color: var(--down);
	}

	svg {
		width: 0.65em;
		height: 0.65em;
		fill: currentColor;
	}

	.percent {
		margin-left: 0.3em;
	}
</style>
