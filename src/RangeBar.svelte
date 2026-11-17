<script lang="ts">
	let {
		label,
		low,
		high,
		value,
		format
	}: {
		label: string;
		low: number;
		high: number;
		value: number;
		format: (price: number) => string;
	} = $props();

	/** Where `value` is between `low` and `high`, from 0 to 1. */
	const at = $derived(high > low ? Math.min(1, Math.max(0, (value - low) / (high - low))) : 0.5);
</script>

<div class="range">
	<span class="label">{label}</span>
	<span class="end">{format(low)}</span>
	<span class="track">
		<span class="fill" style:width="{at * 100}%"></span>
		<span class="mark" style:left="{at * 100}%"></span>
	</span>
	<span class="end">{format(high)}</span>
</div>

<style>
	/* `display: contents` lets the rows share the columns of the grid of the parent. */
	.range {
		display: contents;
	}

	.label {
		color: var(--muted-foreground);
		font-size: 0.8em;
		white-space: nowrap;
	}

	.end {
		font-size: 0.85em;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.track {
		position: relative;
		height: 0.35em;
		border-radius: 999px;
		background: color-mix(in oklch, var(--card-foreground) 12%, transparent);
	}

	.fill {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: inherit;
		background: color-mix(in oklch, var(--primary) 55%, transparent);
	}

	.mark {
		position: absolute;
		top: 50%;
		width: 0.9em;
		height: 0.9em;
		border: 0.2em solid var(--card-foreground);
		border-radius: 50%;
		background: var(--primary);
		translate: -50% -50%;
	}
</style>
