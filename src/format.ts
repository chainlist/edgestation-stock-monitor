import type { Quote, Range } from './yahoo';

/** Index points and exchange rates are not amounts of money, so they show no currency. */
const PLAIN = ['INDEX', 'CURRENCY'];

/** Formats the prices of `quote`, with its currency and its number of decimals. */
export function priceFormat({ type, currency, decimals }: Quote): (price: number) => string {
	const digits = { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
	const plain = new Intl.NumberFormat(undefined, digits);
	if (!currency || PLAIN.includes(type)) return plain.format;
	// Intl reads a code in any case, so "GBp" (pence) would show as pounds. A minor unit and an
	// unknown code show after the number.
	const suffixed = (price: number) => `${plain.format(price)} ${currency}`;
	if (currency !== currency.toUpperCase()) return suffixed;
	try {
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency,
			currencyDisplay: 'narrowSymbol',
			...digits
		}).format;
	} catch {
		return suffixed;
	}
}

/** Formats a change of price, with its sign. */
export const changeFormat = (decimals: number) =>
	new Intl.NumberFormat(undefined, {
		signDisplay: 'exceptZero',
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	}).format;

export const percent = new Intl.NumberFormat(undefined, {
	style: 'percent',
	signDisplay: 'exceptZero',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
}).format;

export const compact = new Intl.NumberFormat(undefined, {
	notation: 'compact',
	maximumFractionDigits: 1
}).format;

const clock = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });
const dayClock = new Intl.DateTimeFormat(undefined, {
	weekday: 'short',
	hour: 'numeric',
	minute: '2-digit'
});
const dateClock = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	hour: 'numeric',
	minute: '2-digit'
});
const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** `time` (ms) as short as `now` lets it be clear: the hour today, the day this week, else the date. */
export function when(time: number, now: number): string {
	const [then, today] = [new Date(time), new Date(now)];
	if (sameDay(then, today)) return clock.format(then);
	if (now - time < 6 * 86_400_000) return dayClock.format(then);
	return date.format(then);
}

/** The time of a point of the chart, as precise as its bars. */
export function pointTime(range: Range, time: number): string {
	if (range === '1D') return clock.format(time);
	if (range === '5D') return dayClock.format(time);
	if (range === '1M') return dateClock.format(time);
	return date.format(time);
}
