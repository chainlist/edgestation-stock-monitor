<script lang="ts" module>
	// Lucide icons, ISC license: https://lucide.dev/license
	const PATHS = {
		edit: [
			'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
			'm15 5 4 4'
		],
		check: ['M20 6 9 17l-5-5'],
		search: ['M11 3a8 8 0 1 0 0 16 8 8 0 1 0 0-16z', 'm21 21-4.3-4.3']
	};

	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let { name }: { name: IconName } = $props();
</script>

<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
	{#each PATHS[name] as d (d)}<path {d} />{/each}
</svg>

<style>
	.icon {
		flex: none;
		width: 1.15em;
		height: 1.15em;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
