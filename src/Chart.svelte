<script lang="ts">
	import type { Point, Span } from './yahoo';

	let {
		points,
		base,
		span,
		up,
		onscrub
	}: {
		points: Point[];
		/** A dashed line at this price, such as the previous close. */
		base?: number;
		/** Places the points by time in this span. Else they are spread evenly, with no gap for nights. */
		span?: Span;
		/** Green if true, else red. */
		up: boolean;
		/** Gets the point under the finger, and `null` when it lifts. Without it, the chart ignores touches. */
		onscrub?: (index: number | null) => void;
	} = $props();

	const id = $props.id();
	let width = $state(0);
	let height = $state(0);
	/** The point under the finger or the mouse. */
	let active = $state<number | null>(null);
	let pressed = false;

	/** The prices at the top and the bottom edges. A flat line sits in the midle. */
	const scale = $derived.by(() => {
		const prices = points.map((point) => point.price);
		if (base !== undefined) prices.push(base);
		const [low, high] = [Math.min(...prices), Math.max(...prices)];
		const pad = (high - low || Math.abs(high) / 100 || 1) * 0.12;
		return { low: low - pad, high: high + pad };
	});

	const x = (i: number) => {
		if (span) return ((points[i].time - span.start) / (span.end - span.start)) * width;
		return points.length > 1 ? (i / (points.length - 1)) * width : width / 2;
	};
	const y = (price: number) => height - ((price - scale.low) / (scale.high - scale.low)) * height;

	const line = $derived(
		points
			.map((point, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(point.price).toFixed(1)}`)
			.join('')
	);
	const area = $derived(
		points.length
			? `${line}L${x(points.length - 1).toFixed(1)} ${height}L${x(0).toFixed(1)} ${height}Z`
			: ''
	);

	/** The index of the point nearest to `clientX`. */
	function nearest(clientX: number, box: DOMRect) {
		const at = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
		if (!span) return Math.round(at * (points.length - 1));
		const time = span.start + at * (span.end - span.start);
		let [low, high] = [0, points.length - 1];
		while (low < high) {
			const mid = (low + high) >> 1;
			if (points[mid].time < time) low = mid + 1;
			else high = mid;
		}
		return low > 0 && time - points[low - 1].time < points[low].time - time ? low - 1 : low;
	}

	function scrub(event: PointerEvent) {
		if (!onscrub || !points.length) return;
		active = nearest(event.clientX, (event.currentTarget as HTMLElement).getBoundingClientRect());
		onscrub(active);
	}

	function release() {
		pressed = false;
		if (active === null) return;
		active = null;
		onscrub?.(null);
	}
</script>

<!-- One finger scrubs. Two fingers turn the page, and the page then takes the touches. -->
<div
	class="chart"
	role="presentation"
	class:live={onscrub}
	bind:clientWidth={width}
	bind:clientHeight={height}
	onpointerdown={(event) => {
		pressed = true;
		scrub(event);
	}}
	onpointermove={(event) => (pressed || event.pointerType === 'mouse') && scrub(event)}
	onpointerup={(event) => event.pointerType !== 'mouse' && release()}
	onpointercancel={release}
	onpointerleave={release}
	onlostpointercapture={release}
>
	{#if width && height && points.length}
		<svg viewBox="0 0 {width} {height}" class:down={!up} aria-hidden="true">
			<defs>
				<linearGradient id="{id}-fade" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="currentColor" stop-opacity="0.28" />
					<stop offset="1" stop-color="currentColor" stop-opacity="0" />
				</linearGradient>
			</defs>
			<path class="area" d={area} fill="url(#{id}-fade)" />
			{#if base !== undefined}
				<line class="base" x1="0" x2={width} y1={y(base)} y2={y(base)} />
			{/if}
			<path class="line" d={line} />
			<!-- Just after the opening, the day has one point and no line. -->
			{#if points.length === 1}
				<circle class="dot" cx={x(0)} cy={y(points[0].price)} r="3.5" />
			{/if}
			{#if active !== null && points[active]}
				<line class="cursor" x1={x(active)} x2={x(active)} y1="0" y2={height} />
				<circle class="dot" cx={x(active)} cy={y(points[active].price)} r="4.5" />
			{/if}
		</svg>
	{/if}
</div>

<style>
	.chart {
		position: relative;
		min-width: 0;
		min-height: 0;
	}

	.live {
		touch-action: none;
		cursor: crosshair;
	}

	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		color: var(--up);
	}

	svg.down {
		color: var(--down);
	}

	.line {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	.base {
		stroke: var(--muted-foreground);
		stroke-width: 1;
		stroke-dasharray: 2 4;
		opacity: 0.8;
	}

	.cursor {
		stroke: var(--card-foreground);
		stroke-width: 1;
		opacity: 0.5;
	}

	.dot {
		fill: currentColor;
		stroke: var(--card-foreground);
		stroke-width: 2;
	}
</style>
