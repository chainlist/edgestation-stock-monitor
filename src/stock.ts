import type { Listing, Quote, Range, Span } from './yahoo';

/** The time between two loads while the market is open. */
export const PERIOD = 5 * 60_000;
/** Loads go on this long after the close, because the last prices of some markets come late. */
const SETTLE = 60 * 60_000;
const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

/** The values of the Show setting in the manifest. */
export type Show = 'chart' | 'price' | 'details';

/** The stock of a placement. Each placement saves its own. */
export interface Stock extends Listing {
	/** The range of the chart. The other views show the day. */
	range: Range;
}

/** The range that `stock` loads in the view `show`. */
export const rangeOf = (stock: Stock, show: Show): Range => (show === 'chart' ? stock.range : '1D');

/** The market is open when `now` is in its regular session. */
export const isOpen = (quote: Quote, now: number) =>
	now >= quote.session.start && now < quote.session.end;

/**
 * When to load again after a load at `now`, in the market `session`. A closed market loads once,
 * at its next opening.
 */
export function nextLoad({ start, end }: Span, now: number): number {
	if (now < start) return start;
	if (now < end + SETTLE) return now + PERIOD;
	// Yahoo tells the next session only on its day. It starts about one day later. If that time
	// is past, Yahoo is late to give the the new session, so the widget asks again each hour.
	const opening = start + DAY;
	return opening > now ? opening : now + HOUR;
}
