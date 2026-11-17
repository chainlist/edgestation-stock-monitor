import type { WidgetApi } from '@edgestation/sdk';

// Yahoo Finance needs no key. Its API is not documented, so a change on its side can brake this
// file. It refuses requests with no user agent, and the app sends its own.
const HOST = 'https://query1.finance.yahoo.com';

/** A search result. */
export interface Listing {
	symbol: string;
	name: string;
	/** The exchange as Yahoo shows it, such as "NASDAQ". */
	exchange: string;
	/** The kind of asset as Yahoo shows it, such as "Equity" or "ETF". */
	kind: string;
}

export const RANGES = ['1D', '5D', '1M', '6M', '1Y', '5Y'] as const;
export type Range = (typeof RANGES)[number];

/** The Yahoo range and bar size of each range. Each gives between 80 and 260 points. */
const QUERY: Record<Range, string> = {
	'1D': 'range=1d&interval=5m',
	'5D': 'range=5d&interval=15m',
	'1M': 'range=1mo&interval=60m',
	'6M': 'range=6mo&interval=1d',
	'1Y': 'range=1y&interval=1d',
	'5Y': 'range=5y&interval=1wk'
};

export interface Point {
	/** Milliseconds. */
	time: number;
	price: number;
}

/** A time span in milliseconds. */
export interface Span {
	start: number;
	end: number;
}

export interface Quote {
	range: Range;
	/** Yahoo's instrument type, such as "EQUITY", "INDEX" or "CRYPTOCURRENCY". */
	type: string;
	/** An ISO code, or a minor unit such as "GBp" (pence). */
	currency: string;
	/** The number of decimals that Yahoo uses for this price. */
	decimals: number;
	exchange: string;
	price: number;
	/** When the exchange gave `price`, in milliseconds. */
	time: number;
	/** The close of the previous session. The change of the day is from it. */
	previousClose: number;
	/** The close before the first point. The change of the range is from it. */
	base: number;
	/** The first price of the last session. Only the 1D range gives it. */
	open?: number;
	dayLow?: number;
	dayHigh?: number;
	yearLow?: number;
	yearHigh?: number;
	volume?: number;
	/** The regular session of today, or of the next day when Yahoo has moved on. */
	session: Span;
	/** The sessions that `points` cover. Only the 1D range gives it, so its chart can be placed by time. */
	span?: Span;
	points: Point[];
}

/** Yahoo has no data for this symbol, for example because it is delisted. */
export class Missing extends Error {}

interface SearchItem {
	symbol?: string;
	shortname?: string;
	longname?: string;
	exchDisp?: string;
	typeDisp?: string;
}

interface ChartMeta {
	currency?: string;
	instrumentType?: string;
	fullExchangeName?: string;
	priceHint?: number;
	regularMarketPrice: number;
	regularMarketTime: number;
	previousClose?: number;
	chartPreviousClose?: number;
	regularMarketDayLow?: number;
	regularMarketDayHigh?: number;
	fiftyTwoWeekLow?: number;
	fiftyTwoWeekHigh?: number;
	regularMarketVolume?: number;
	currentTradingPeriod: { regular: { start: number; end: number } };
	tradingPeriods?: unknown;
}

interface ChartAnswer {
	chart?: {
		result?: {
			meta: ChartMeta;
			timestamp?: number[];
			indicators: { quote: { open?: (number | null)[]; close?: (number | null)[] }[] };
		}[];
		error?: { code?: string; description?: string } | null;
	};
}

/** Companies, funds, indices, crypto and currencies that match `term`, best match first. */
export async function search(api: WidgetApi, term: string): Promise<Listing[]> {
	const url = `${HOST}/v1/finance/search?q=${encodeURIComponent(term)}&quotesCount=10&newsCount=0&listsCount=0`;
	const response = await api.fetch(url);
	if (!response.ok) throw new Error(`Yahoo answered ${response.status}`);
	const data: { quotes?: SearchItem[] } = await response.json();
	return (data.quotes ?? []).flatMap((item) =>
		item.symbol
			? [
					{
						symbol: item.symbol,
						// The short name can be cut or in capitals, such as "VODAFONE GROUP PLC ORD".
						name: (item.longname || item.shortname || item.symbol).trim(),
						exchange: item.exchDisp ?? '',
						kind: item.typeDisp ?? ''
					}
				]
			: []
	);
}

const ms = (seconds: number) => seconds * 1000;

/** The price of `symbol` now, and its prices over `range`. */
export async function quote(api: WidgetApi, symbol: string, range: Range): Promise<Quote> {
	const url = `${HOST}/v8/finance/chart/${encodeURIComponent(symbol)}?${QUERY[range]}`;
	const response = await api.fetch(url);
	// Yahoo answers 404 with a JSON error for a symbol it does not know.
	const data: ChartAnswer = await response.json().catch(() => ({}));
	const result = data.chart?.result?.[0];
	if (!result) {
		if (data.chart?.error?.code === 'Not Found') throw new Missing(data.chart.error.description);
		throw new Error(`Yahoo answered ${response.status}`);
	}

	const { meta, timestamp = [], indicators } = result;
	const closes = indicators.quote[0]?.close ?? [];
	// A bar with no trade has a null price.
	const points = timestamp.flatMap((time, i) => {
		const price = closes[i];
		return price == null ? [] : [{ time: ms(time), price }];
	});
	const regular = meta.currentTradingPeriod.regular;
	const base = meta.chartPreviousClose ?? points[0]?.price ?? meta.regularMarketPrice;
	return {
		range,
		type: meta.instrumentType ?? '',
		currency: meta.currency ?? '',
		decimals: meta.priceHint ?? 2,
		exchange: meta.fullExchangeName ?? '',
		price: meta.regularMarketPrice,
		time: ms(meta.regularMarketTime),
		previousClose: meta.previousClose ?? base,
		base,
		open:
			range === '1D'
				? (indicators.quote[0]?.open?.find((price) => price != null) ?? undefined)
				: undefined,
		dayLow: meta.regularMarketDayLow,
		dayHigh: meta.regularMarketDayHigh,
		yearLow: meta.fiftyTwoWeekLow,
		yearHigh: meta.fiftyTwoWeekHigh,
		volume: meta.regularMarketVolume || undefined,
		session: { start: ms(regular.start), end: ms(regular.end) },
		span: range === '1D' ? sessions(meta.tradingPeriods) : undefined,
		points
	};
}

/** The start of the first and the end of the last trading period, from a list of lists. */
function sessions(periods: unknown): Span | undefined {
	if (!Array.isArray(periods)) return undefined;
	const flat = periods.flat() as { start?: number; end?: number }[];
	const start = flat[0]?.start;
	const end = flat.at(-1)?.end;
	return start && end && end > start ? { start: ms(start), end: ms(end) } : undefined;
}
