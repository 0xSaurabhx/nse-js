# nse-js 

nse-js is a Node.js library for fetching data from the National Stock Exchange (NSE) of India. It provides various methods to retrieve market data, circulars, option chains, corporate actions, and more.

> [!IMPORTANT]
> **This module is not yet ready for production use as it's not tested on production environment.**

## Installation

```bash
npm install nse-js
```

## API limits

All requests through NSE are rate limited or throttled to 3 requests per second. This allows making large number of requests without overloading the server or getting blocked.

- If downloading a large number of reports from NSE, please do so after-market hours (Preferably late evening).
- Add an extra 0.5 - 1 sec sleep between requests. The extra run time likely wont make a difference to your script.
- Save the file and reuse them instead of re-downloading.

## Usage

```javascript
const NSE = require('nse.js');
const nse = new NSE();
```

## Methods

### `status()`
Get market status.

```javascript
nse.status().then(data => console.log(data));
```

### `circulars(deptCode, fromDate, toDate)`
Get NSE circulars.

- `deptCode` (optional): Department code.
- `fromDate` (optional): Start date.
- `toDate` (optional): End date.

```javascript
nse.circulars().then(data => console.log(data));
```

### `blockDeals()`
Get block deals.

```javascript
nse.blockDeals().then(data => console.log(data));
```

### `fnoLots()`
Get the lot size of FnO stocks.

```javascript
nse.fnoLots().then(data => console.log(data));
```

### `optionChain(symbol)`
Get the option chain for a symbol.

- `symbol`: Symbol code.

```javascript
nse.optionChain('nifty').then(data => console.log(data));
```

### `maxpain(optionChain, expiryDate)`
Get the max pain strike price.

- `optionChain`: Option chain data.
- `expiryDate`: Expiry date.

```javascript
nse.maxpain(optionChain, new Date()).then(data => console.log(data));
```

### `compileOptionChain(symbol, expiryDate)`
Compile the option chain for a symbol.

- `symbol`: Symbol code.
- `expiryDate`: Expiry date.

```javascript
nse.compileOptionChain('nifty', new Date()).then(data => console.log(data));
```

### `advanceDecline()`
Get advance decline data.

```javascript
nse.advanceDecline().then(data => console.log(data));
```

### `holidays(type)`
Get NSE holidays.

- `type`: Type of holiday (trading or clearing).

```javascript
nse.holidays('trading').then(data => console.log(data));
```

### `equityMetaInfo(symbol)`
Get equity meta info.

- `symbol`: Symbol code.

```javascript
nse.equityMetaInfo('RELIANCE').then(data => console.log(data));
```

### `quote(symbol, type, section)`
Get quote data.

- `symbol`: Symbol code.
- `type`: Type of quote (equity or fno).
- `section`: Section of quote (trade_info).

```javascript
nse.quote('RELIANCE').then(data => console.log(data));
```

### `equityQuote(symbol)`
Get equity quote data.

- `symbol`: Symbol code.

```javascript
nse.equityQuote('RELIANCE').then(data => console.log(data));
```

### `gainers(data, count)`
Get gainers data.

- `data`: Data object.
- `count`: Number of gainers to return.

```javascript
nse.gainers(data).then(data => console.log(data));
```

### `losers(data, count)`
Get losers data.

- `data`: Data object.
- `count`: Number of losers to return.

```javascript
nse.losers(data).then(data => console.log(data));
```

### `listFnoStocks()`
Get list of FNO stocks.

```javascript
nse.listFnoStocks().then(data => console.log(data));
```

### `listIndices()`
Get list of indices.

```javascript
nse.listIndices().then(data => console.log(data));
```

### `listIndexStocks(index)`
Get list of index stocks.

- `index`: Index name.

```javascript
nse.listIndexStocks('NIFTY 50').then(data => console.log(data));
```

### `listEtf()`
Get list of ETFs.

```javascript
nse.listEtf().then(data => console.log(data));
```

### `listSme()`
Get list of SMEs.

```javascript
nse.listSme().then(data => console.log(data));
```

### `listSgb()`
Get list of SGBs.

```javascript
nse.listSgb().then(data => console.log(data));
```

### `listCurrentIPO()`
Get list of current IPOs.

```javascript
nse.listCurrentIPO().then(data => console.log(data));
```

### `listUpcomingIPO()`
Get list of upcoming IPOs.

```javascript
nse.listUpcomingIPO().then(data => console.log(data));
```

### `listPastIPO(fromDate, toDate)`
Get list of past IPOs.

- `fromDate`: Start date.
- `toDate`: End date.

```javascript
nse.listPastIPO(new Date('2023-01-01'), new Date('2023-12-31')).then(data => console.log(data));
```

### `actions(segment, symbol, fromDate, toDate)`
Get corporate actions.

- `segment`: Segment name.
- `symbol`: Symbol code.
- `fromDate`: Start date.
- `toDate`: End date.

```javascript
nse.actions('equities', 'RELIANCE', new Date('2023-01-01'), new Date('2023-12-31')).then(data => console.log(data));
```

### `announcements(index, symbol, fno, fromDate, toDate)`
Get corporate announcements.

- `index`: Index name.
- `symbol`: Symbol code.
- `fno`: FNO flag.
- `fromDate`: Start date.
- `toDate`: End date.

```javascript
nse.announcements('equities', 'RELIANCE', false, new Date('2023-01-01'), new Date('2023-12-31')).then(data => console.log(data));
```

### `boardMeetings(index, symbol, fno, fromDate, toDate)`
Get board meetings.

- `index`: Index name.
- `symbol`: Symbol code.
- `fno`: FNO flag.
- `fromDate`: Start date.
- `toDate`: End date.

```javascript
nse.boardMeetings('equities', 'RELIANCE', false, new Date('2023-01-01'), new Date('2023-12-31')).then(data => console.log(data));
```

### `equityBhavcopy(date, folder)`
Get equity bhavcopy.

- `date`: Date.
- `folder`: Folder path.

```javascript
nse.equityBhavcopy(new Date(), './downloads').then(data => console.log(data));
```

### `deliveryBhavcopy(date, folder)`
Get delivery bhavcopy.

- `date`: Date.
- `folder`: Folder path.

```javascript
nse.deliveryBhavcopy(new Date(), './downloads').then(data => console.log(data));
```

### `indicesBhavcopy(date, folder)`
Get indices bhavcopy.

- `date`: Date.
- `folder`: Folder path.

```javascript
nse.indicesBhavcopy(new Date(), './downloads').then(data => console.log(data));
```

### `fnoBhavcopy(date, folder)`
Get FNO bhavcopy.

- `date`: Date.
- `folder`: Folder path.

```javascript
nse.fnoBhavcopy(new Date(), './downloads').then(data => console.log(data));
```

### `pricebandReport(date, folder)`
Get priceband report.

- `date`: Date.
- `folder`: Folder path.

```javascript
nse.pricebandReport(new Date(), './downloads').then(data => console.log(data));
```

### `prBhavcopy(date, folder)`
Get PR bhavcopy.

- `date`: Date.
- `folder`: Folder path.

```javascript
nse.prBhavcopy(new Date(), './downloads').then(data => console.log(data));
```

## License

This project is licensed under the GPL v3 License.

## Credits
This project is inspired by [BennyThadikaran's](https://github.com/BennyThadikaran) python version of NSE API.
