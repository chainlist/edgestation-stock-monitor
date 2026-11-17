# Stock monitor

One stock, fund, index, crypto or currency, for
[EdgeStation](https://github.com/chainlist/edgestation), with prices from Yahoo Finance.

- **Pick the stock on the widget.** Search a name or a symbol (Apple, AAPL, S&P 500, Bitcoin,
  EUR/USD), tap a result, then **Apply**. The pencil at the top right picks another one.
- **Pick the view in the widget settings** (Show):
  - **Chart**: the price over 1 day, 5 days, 1 month, 6 months, 1 year or 5 years, with the
    change over that range. Drag a finger on the chart to read the price at any point.
  - **Price of the day**: the price in large type, the change since the previous close, and the
    chart of the day.
  - **Day in detail**: the price and its change, the open, the previous close, the volume, and
    where the price is in the range of the day and of the last 52 weeks.

The price loads when the page shows, then every 5 minutes while the market is open and the page
is on screen. A closed market loads again at its next opening. A dot tells if the market is open,
next to the time of the price. Yahoo delays the prices of some exchanges by 15 minutes or more.

Yahoo Finance needs no account or key, but its API is not documented, so Yahoo can change it or
limit it at any time. Each placement keeps its own stock.
