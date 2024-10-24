const https = require('https');
const { DateTime } = require('luxon');

class NSE {
  constructor() {
    this.baseUrl = 'https://www.nseindia.com/api';
    this.archiveUrl = 'https://nsearchives.nseindia.com'
    this.__optionIndex = ['nifty', 'banknifty', 'finnifty', 'niftyit'];
    
    // Default headers required for NSE requests
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.nseindia.com/get-quotes/equity?symbol=HDFCBANK'
    };

    this.cookieExpiry = null;
    this.cookies = null;
  }

  async __getCookies() {
    if (this.cookies && this.cookieExpiry && DateTime.now() < this.cookieExpiry) {
      return this.cookies;
    }
  
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.nseindia.com',
        path: '/option-chain',
        headers: this.headers
      };
  
      const req = https.get(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error('Failed to fetch cookies'));
          return;
        }
  
        this.cookies = res.headers['set-cookie'];
        this.cookieExpiry = DateTime.now().plus({ minutes: 30 });
        resolve(this.cookies);
      });
  
      req.on('error', (error) => {
        reject(new Error('Failed to fetch cookies: ' + error.message));
      });
  
      req.end();
    });
  }

  async __req(url, params = {}) {
    const cookies = await this.__getCookies();
  
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      urlObj.search = new URLSearchParams(params).toString();
  
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          ...this.headers,
          Cookie: cookies.join('; ')
        }
      };
  
      const req = https.get(options, (res) => {
        let data = '';
  
        res.on('data', (chunk) => {
          data += chunk;
        });
  
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Request failed: ${res.statusCode}`));
            return;
          }
          resolve(JSON.parse(data));
        });
      });
  
      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });
  
      req.end();
    });
  }

  async status() {
    /**
     * Get market status
     * @returns {Promise<Array>}
     */
    const data = await this.__req(`${this.baseUrl}/marketStatus`);
    return data.marketState;
  }

  async circulars(deptCode = null, fromDate = null, toDate = null) {
    /**
     * Get NSE circulars
     * @param {string} deptCode - Department code (optional)
     * @param {Date} fromDate - Start date (optional)
     * @param {Date} toDate - End date (optional)
     * @returns {Promise<Object>}
     */
    
    if (!toDate) {
      toDate = new Date();
    }

    if (!fromDate) {
      fromDate = new Date(toDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days before
    }

    if (toDate < fromDate) {
      throw new Error('Argument `toDate` cannot be less than `fromDate`');
    }

    const params = {
      from_date: fromDate.toLocaleDateString('en-IN'),
      to_date: toDate.toLocaleDateString('en-IN')
    };

    if (deptCode) {
      params.dept = deptCode.toUpperCase();
    }

    return await this.__req(`${this.baseUrl}/circulars`, params);
  }

  async blockDeals() {
    /**
     * Get block deals
     * @returns {Promise<Object>}
     */
    return await this.__req(`${this.baseUrl}/block-deal`);
  }

  async fnoLots() {
    /**
     * Get the lot size of FnO stocks
     * @returns {Promise<Object>}
     */
    const url = 'https://nsearchives.nseindia.com/content/fo/fo_mktlots.csv';
    const response = await this.__req(url);
    
    const lines = response.split('\n');
    const result = {};

    lines.forEach(line => {
      const [, sym, , lot] = line.split(',');
      if (sym && lot) {
        result[sym.trim()] = parseInt(lot.trim());
      }
    });

    return result;
  }

  async optionChain(symbol) {
    /**
     * Get the option chain for a symbol
     * @param {string} symbol - Symbol code
     * @returns {Promise<Object>}
     */
    if (this.__optionIndex.includes(symbol)) {
      return await this.__req(`${this.baseUrl}/option-chain-indices`, { symbol: symbol.toUpperCase() });
    } else {
      return await this.__req(`${this.baseUrl}/option-chain-equities`, { symbol: symbol.toUpperCase() });
    }
  }

  async maxpain(optionChain, expiryDate) {
    /**
     * Get the max pain strike price
     * @param {Object} optionChain - Option chain data
     * @param {Date} expiryDate - Expiry date
     * @returns {Promise<number>}
     */
    const expiryDateStr = expiryDate.toLocaleDateString('en-IN');
    const data = optionChain.records.data;
    const result = {};

    data.forEach(item => {
      if (item.expiryDate === expiryDateStr) {
        const strike = item.strikePrice;
        let pain = 0;

        data.forEach(otherItem => {
          if (otherItem.expiryDate === expiryDateStr) {
            const diff = strike - otherItem.strikePrice;

            if (diff > 0) {
              pain += -diff * otherItem.CE.openInterest;
            } else if (diff < 0) {
              pain += diff * otherItem.PE.openInterest;
            }
          }
        });

        result[strike] = pain;
      }
    });

    return Math.max(...Object.keys(result));
  }

  async compileOptionChain(symbol, expiryDate) {
    /**
     * Compile the option chain for a symbol
     * @param {string} symbol - Symbol code
     * @param {Date} expiryDate - Expiry date
     * @returns {Promise<Object>}
     */
    const optionChain = await this.optionChain(symbol);
    const expiryDateStr = expiryDate.toLocaleDateString('en-IN');
    const data = optionChain.records.data;
    const result = {
      expiry: expiryDateStr,
      timestamp: optionChain.records.timestamp,
      underlying: optionChain.records.underlyingValue,
      atm: null,
      maxpain: null,
      maxCoi: null,
      maxPoi: null,
      coiTotal: 0,
      poiTotal: 0,
      pcr: null,
      chain: {}
    };

    const strike1 = data[0].strikePrice;
    const strike2 = data[1].strikePrice;
    const multiple = strike1 - strike2;

    result.atm = multiple * Math.round(result.underlying / multiple);

    data.forEach(item => {
      if (item.expiryDate === expiryDateStr) {
        const strike = item.strikePrice;
        result.chain[strike] = {
          ce: {},
          pe: {}
        };

        if (item.CE) {
          result.chain[strike].ce = {
            last: item.CE.lastPrice,
            oi: item.CE.openInterest,
            chg: item.CE.chg,
            iv: item.CE.impliedVolatility
          };
          result.coiTotal += item.CE.openInterest;
        } else {
          result.chain[strike].ce = {
            last: 0,
            oi: 0,
            chg: 0,
            iv: 0
          };
        }

        if (item.PE) {
          result.chain[strike].pe = {
            last: item.PE.lastPrice,
            oi: item.PE.openInterest,
            chg: item.PE.chg,
            iv: item.PE.impliedVolatility
          };
          result.poiTotal += item.PE.openInterest;
        } else {
          result.chain[strike].pe = {
            last: 0,
            oi: 0,
            chg: 0,
            iv: 0
          };
        }

        if (result.chain[strike].pe.oi === 0 || result.chain[strike].ce.oi === 0) {
          result.chain[strike].pcr = null;
        } else {
          result.chain[strike].pcr = Math.round(result.chain[strike].pe.oi / result.chain[strike].ce.oi * 100) / 100;
        }
      }
    });

    result.maxpain = await this.maxpain(optionChain, expiryDate);
    result.maxCoi = Math.max(...Object.keys(result.chain).map(strike => result.chain[strike].ce.oi));
    result.maxPoi = Math.max(...Object.keys(result.chain).map(strike => result.chain[strike].pe.oi));
    result.pcr = Math.round(result.poiTotal / result.coiTotal * 100) / 100;

    return result;
  }

  async advanceDecline() {
    /**
     * Get advance decline data
     * @returns {Promise<Object>}
     */
    const url = 'https://www1.nseindia.com/common/json/indicesAdvanceDeclines.json';
    return await this.__req(url);
  }

  async holidays(type = 'trading') {
    /**
     * Get NSE holidays
     * @param {string} type - Type of holiday (trading or clearing)
     * @returns {Promise<Object>}
     */
    return await this.__req(`${this.baseUrl}/holiday-master`, { type });
  }

  async equityMetaInfo(symbol) {
    /**
     * Get equity meta info
     * @param {string} symbol - Symbol code
     * @returns {Promise<Object>}
     */
    return await this.__req(`${this.baseUrl}/equity-meta-info`, { symbol: symbol.toUpperCase() });
  }

  async quote(symbol, type = 'equity', section = null) {
    /**
     * Get quote data
     * @param {string} symbol - Symbol code
     * @param {string} type - Type of quote (equity or fno)
     * @param {string} section - Section of quote (trade_info)
     * @returns {Promise<Object>}
     */
    if (type === 'equity') {
      return await this.__req(`${this.baseUrl}/quote-equity`, { symbol: symbol.toUpperCase(), section });
    } else {
      return await this.__req(`${this.baseUrl}/quote-derivative`, { symbol: symbol.toUpperCase(), section });
    }
  }

  async equityQuote(symbol) {
    /**
     * Get equity quote data
     * @param {string} symbol - Symbol code
     * @returns {Promise<Object>}
     */
    const quote = await this.quote(symbol);
    const tradeInfo = await this.quote(symbol, 'equity', 'trade_info');
    return {
      date: quote.metadata.lastUpdateTime,
      open: quote.priceInfo.open,
      high: quote.priceInfo.intraDayHighLow.max,
      low: quote.priceInfo.intraDayHighLow.min,
      close: quote.priceInfo.close || quote.priceInfo.lastPrice,
      volume: tradeInfo.securityWiseDP.quantityTraded
    };
  }

  async gainers(data, count = null) {
    /**
     * Get gainers data
     * @param {Object} data - Data object
     * @param {number} count - Number of gainers to return
     * @returns {Promise<Array>}
     */
    return data.data.filter(item => item.pChange > 0).sort((a, b) => b.pChange - a.pChange).slice(0, count);
  }

  async losers(data, count = null) {
    /**
     * Get losers data
     * @param {Object} data - Data object
     * @param {number} count - Number of losers to return
     * @returns {Promise<Array>}
     */
    return data.data.filter(item => item.pChange < 0).sort((a, b) => a.pChange - b.pChange).slice(0, count);
  }

  async listFnoStocks() {
    /**
     * Get list of FNO stocks
     * @returns {Promise<Object>}
     */
    return await this.__req(`${this.baseUrl}/equity-stockIndices`, { index: 'SECURITIES IN F&O' });
  }

  async listIndices() {
    /**
     * Get list of indices
     * @returns {Promise<Object>}
     */
    return await this.__req(`${this.baseUrl}/allIndices`);
  }

  async listIndexStocks(index) {
    /**
     * Get list of index stocks
     * @param {string} index - Index name
     * @returns {Promise<Object>}
     */
    return await this.__req(`${this.baseUrl}/equity-stockIndices`, { index: index.toUpperCase() });
  }

  async listEtf() {
    /**
     * Get list of ETFs
     * @returns {Promise<Object>}
     */
    return await this.__req(`${this.baseUrl}/etf`);
  }

  async listSme() {
    /**
     * Get list of SMEs
     * @returns {Promise<Object>}
     */
    return await this.__req(`${this.baseUrl}/live-analysis-emerge`);
  }

  async listSgb() {
    /**
     * Get list of SGBs
     * @returns {Promise<Object>}
     */
    return await this.__req(`${this.baseUrl}/sovereign-gold-bonds`);
  }

  async listCurrentIPO() {
    /**
     * Get list of current IPOs
     * @returns {Promise<Array>}
     */
    return await this.__req(`${this.baseUrl}/ipo-current-issue`);
  }

  async listUpcomingIPO() {
    /**
 * Get list of upcoming IPOs
     * @returns {Promise<Array>}
     */
    return await this.__req(`${this.baseUrl}/all-upcoming-issues`, { category: 'ipo' });
  }

  async listPastIPO(fromDate = null, toDate = null) {
    /**
     * Get list of past IPOs
     * @param {Date} fromDate - Start date
     * @param {Date} toDate - End date
     * @returns {Promise<Array>}
     */
    if (!toDate) {
      toDate = new Date();
    }

    if (!fromDate) {
      fromDate = new Date(toDate.getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days before
    }

    if (toDate < fromDate) {
      throw new Error('Argument `toDate` cannot be less than `fromDate`');
    }

    return await this.__req(`${this.baseUrl}/public-past-issues`, {
      from_date: fromDate.toLocaleDateString('en-IN'),
      to_date: toDate.toLocaleDateString('en-IN')
    });
  }

  async actions(segment = 'equities', symbol = null, fromDate = null, toDate = null) {
    /**
     * Get corporate actions
     * @param {string} segment - Segment name
     * @param {string} symbol - Symbol code
     * @param {Date} fromDate - Start date
     * @param {Date} toDate - End date
     * @returns {Promise<Array>}
     */
    const params = {
      index: segment
    };

    if (symbol) {
      params.symbol = symbol.toUpperCase();
    }

    if (fromDate && toDate) {
      if (toDate < fromDate) {
        throw new Error('Argument `toDate` cannot be less than `fromDate`');
      }

      params.from_date = fromDate.toLocaleDateString('en-IN');
      params.to_date = toDate.toLocaleDateString('en-IN');
    }

    return await this.__req(`${this.baseUrl}/corporates-corporateActions`, params);
  }

  async announcements(index = 'equities', symbol = null, fno = false, fromDate = null, toDate = null) {
    /**
     * Get corporate announcements
     * @param {string} index - Index name
     * @param {string} symbol - Symbol code
     * @param {boolean} fno - FNO flag
     * @param {Date} fromDate - Start date
     * @param {Date} toDate - End date
     * @returns {Promise<Array>}
     */
    const params = {
      index
    };

    if (symbol) {
      params.symbol = symbol.toUpperCase();
    }

    if (fno) {
      params.fo_sec = true;
    }

    if (fromDate && toDate) {
      if (toDate < fromDate) {
        throw new Error('Argument `toDate` cannot be less than `fromDate`');
      }

      params.from_date = fromDate.toLocaleDateString('en-IN');
      params.to_date = toDate.toLocaleDateString('en-IN');
    }

    return await this.__req(`${this.baseUrl}/corporate-announcements`, params);
  }

  async boardMeetings(index = 'equities', symbol = null, fno = false, fromDate = null, toDate = null) {
    /**
     * Get board meetings
     * @param {string} index - Index name
     * @param {string} symbol - Symbol code
     * @param {boolean} fno - FNO flag
     * @param {Date} fromDate - Start date
     * @param {Date} toDate - End date
     * @returns {Promise<Array>}
     */
    const params = {
      index
    };

    if (symbol) {
      params.symbol = symbol.toUpperCase();
    }

    if (fno) {
      params.fo_sec = true;
    }

    if (fromDate && toDate) {
      if (toDate < fromDate) {
        throw new Error('Argument `toDate` cannot be less than `fromDate`');
      }

      params.from_date = fromDate.toLocaleDateString('en-IN');
      params.to_date = toDate.toLocaleDateString('en-IN');
    }

    return await this.__req(`${this.baseUrl}/corporate-board-meetings`, params);
  }
}

module.exports = NSE;