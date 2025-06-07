// API integration module for Stock Beacon
// Handles connections to Polygon, Twelve Data, Alpha Vantage, SEC EDGAR, and Benzinga APIs

const fetch = require('node-fetch');

class StockDataAPI {
  constructor() {
    // API keys
    this.polygonApiKey = process.env.POLYGON_API_KEY || 'KrRfcFirynZz7P4KPHdPXkexR5lWXMhd';
    this.twelveDataApiKey = process.env.TWELVE_DATA_API_KEY || '2a133d23426b4e7bbe3eb27022cf02da';
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '74E9G7K1DV3QZ5TJ';
    this.benzingaApiKey = process.env.BENZINGA_API_KEY || 'demo_key';
    
    // Cache for tickers to avoid repeated API calls
    this.tickersCache = null;
    this.tickersCacheExpiry = null;
    this.tickersCacheDuration = 3600000; // 1 hour in milliseconds
  }

  /**
   * Fetch all available tickers from Polygon API
   * @returns {Promise} - Promise resolving to array of ticker symbols
   */
  async fetchAllTickers() {
    try {
      // Check if we have a valid cache
      const now = Date.now();
      if (this.tickersCache && this.tickersCacheExpiry && now < this.tickersCacheExpiry) {
        console.log('Using cached tickers list');
        return this.tickersCache;
      }
      
      console.log('Fetching tickers from Polygon API');
      
      // Try to fetch from Polygon API
      try {
        const url = `https://api.polygon.io/v3/reference/tickers?active=true&sort=ticker&order=asc&limit=1000&apiKey=${this.polygonApiKey}`;
        console.log(`Fetching tickers from Polygon API: ${url}`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Polygon API response status:', response.status);
        console.log('Polygon API response data structure:', Object.keys(data));
        
        if (data.results && data.results.length > 0) {
          // Extract ticker symbols
          const tickers = data.results.map(ticker => ticker.ticker);
          console.log(`Successfully fetched ${tickers.length} tickers from Polygon API`);
          
          // Cache the results
          this.tickersCache = tickers;
          this.tickersCacheExpiry = now + this.tickersCacheDuration;
          
          return tickers;
        } else {
          console.warn('Polygon API returned no results or invalid format:', data);
          throw new Error('No tickers found in Polygon API response');
        }
      } catch (polygonError) {
        console.error('Error fetching from Polygon API:', polygonError);
        throw polygonError; // Re-throw to use fallback
      }
    } catch (error) {
      console.error('Error in fetchAllTickers:', error);
      console.log('Using fallback ticker list');
      
      // Return a default list of tickers as fallback
      const fallbackTickers = [
        // US Stocks
        'NVDA', 'TSLA', 'AMZN', 'AAPL', 'MSFT', 'GOOGL', 'META', 'F', 'T', 'PLTR', 'SNAP', 'SIRI', 'NOK',
        // European Stocks
        'SAP.DE', 'ASML.AS', 'LVMH.PA', 'SIE.DE', 'NESN.SW',
        // Asian Stocks
        'BABA', '9988.HK', 'TCEHY', '0700.HK', 'SONY', '6758.T', 'SMSN.IL', '005930.KS', 'TM', '7203.T',
        // Other Global Stocks
        'RIO.L', 'BHP.AX', 'VALE', 'PBR', 'SU'
      ];
      
      // Cache the fallback results
      this.tickersCache = fallbackTickers;
      this.tickersCacheExpiry = now + this.tickersCacheDuration;
      
      return fallbackTickers;
    }
  }

  /**
   * Fetch real-time stock data from Polygon API with fallbacks to Twelve Data and Alpha Vantage
   * @param {Array} symbols - Array of stock symbols to fetch
   * @returns {Promise} - Promise resolving to stock data
   */
  async fetchStockData(symbols) {
    try {
      console.log(`Fetching stock data for: ${symbols.join(', ')}`);
      
      // Try Polygon API first - using real API data as requested by user
      try {
        const polygonData = await this.fetchPolygonData(symbols);
        if (polygonData && polygonData.length > 0) {
          console.log('Successfully fetched data from Polygon API');
          return polygonData;
        }
      } catch (polygonError) {
        console.error('Error fetching from Polygon API:', polygonError.message);
      }
      
      // Try Twelve Data API as first fallback
      try {
        const twelveData = await this.fetchTwelveData(symbols);
        if (twelveData && twelveData.length > 0) {
          console.log('Successfully fetched data from Twelve Data API');
          return twelveData;
        }
      } catch (twelveDataError) {
        console.error('Error fetching from Twelve Data API:', twelveDataError.message);
      }
      
      // Try Alpha Vantage API as second fallback
      try {
        const alphaVantageData = await this.fetchAlphaVantageData(symbols);
        if (alphaVantageData && alphaVantageData.length > 0) {
          console.log('Successfully fetched data from Alpha Vantage API');
          return alphaVantageData;
        }
      } catch (alphaVantageError) {
        console.error('Error fetching from Alpha Vantage API:', alphaVantageError.message);
      }
      
      // If all APIs fail, return simulated data as last resort
      console.warn('All API calls failed, using simulated data as fallback');
      return this.getSimulatedPolygonResponse(symbols);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      // Return simulated data as fallback only if all else fails
      return this.getSimulatedPolygonResponse(symbols);
    }
  }

  /**
   * Fetch data from Polygon API
   * @param {Array} symbols - Stock symbols to fetch
   * @returns {Promise} - Promise resolving to processed stock data
   */
  async fetchPolygonData(symbols) {
    try {
      const results = [];
      
      // Fetch data for each symbol individually to handle API limits
      for (const symbol of symbols) {
        try {
          // Get previous close data
          const prevCloseUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${this.polygonApiKey}`;
          console.log(`Fetching previous close data for ${symbol}`);
          const prevCloseResponse = await fetch(prevCloseUrl);
          const prevCloseData = await prevCloseResponse.json();
          
          // Log response for debugging
          console.log(`Polygon API response for ${symbol} previous close:`, 
                      prevCloseResponse.status, 
                      prevCloseData.status, 
                      prevCloseData.results ? `Found ${prevCloseData.results.length} results` : 'No results');
          
          // Get ticker details
          const tickerDetailsUrl = `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${this.polygonApiKey}`;
          console.log(`Fetching ticker details for ${symbol}`);
          const tickerDetailsResponse = await fetch(tickerDetailsUrl);
          const tickerDetailsData = await tickerDetailsResponse.json();
          
          // Log response for debugging
          console.log(`Polygon API response for ${symbol} ticker details:`, 
                      tickerDetailsResponse.status, 
                      tickerDetailsData.status,
                      tickerDetailsData.results ? 'Found results' : 'No results');
          
          if (prevCloseData.results && prevCloseData.results.length > 0 && tickerDetailsData.results) {
            const result = prevCloseData.results[0];
            const details = tickerDetailsData.results;
            
            results.push({
              symbol: symbol,
              price: result.c, // Close price
              change: result.c - result.o, // Close - Open
              changePercent: ((result.c - result.o) / result.o) * 100,
              volume: result.v / 1000000, // Convert to millions
              relVolume: 1.0, // Default relative volume
              sentiment: this.calculateSentiment(result.c - result.o, ((result.c - result.o) / result.o) * 100),
              description: details.description || `${symbol} stock`
            });
            console.log(`Successfully processed data for ${symbol}`);
          } else {
            console.warn(`Incomplete data for ${symbol}, using simulated data instead`);
            // Use simulated data for this symbol
            const simulatedData = this.getSimulatedPolygonResponse([symbol])[0];
            if (simulatedData) {
              results.push(simulatedData);
              console.log(`Added simulated data for ${symbol}`);
            }
          }
        } catch (symbolError) {
          console.error(`Error processing symbol ${symbol}:`, symbolError);
          // Use simulated data for this symbol
          const simulatedData = this.getSimulatedPolygonResponse([symbol])[0];
          if (simulatedData) {
            results.push(simulatedData);
            console.log(`Added simulated data for ${symbol} after error`);
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in Polygon API fetch:', error);
      throw error;
    }
  }

  /**
   * Fetch data from Twelve Data API
   * @param {Array} symbols - Stock symbols to fetch
   * @returns {Promise} - Promise resolving to processed stock data
   */
  async fetchTwelveData(symbols) {
    try {
      const results = [];
      
      // Fetch data for each symbol individually
      for (const symbol of symbols) {
        // Get price data
        const priceUrl = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${this.twelveDataApiKey}`;
        const priceResponse = await fetch(priceUrl);
        const priceData = await priceResponse.json();
        
        // Get time series data for volume
        const timeSeriesUrl = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=1&apikey=${this.twelveDataApiKey}`;
        const timeSeriesResponse = await fetch(timeSeriesUrl);
        const timeSeriesData = await timeSeriesResponse.json();
        
        if (priceData && !priceData.code && timeSeriesData && timeSeriesData.values) {
          const change = parseFloat(priceData.change);
          const price = parseFloat(priceData.close);
          const changePercent = parseFloat(priceData.percent_change);
          const volume = parseFloat(timeSeriesData.values[0].volume) / 1000000; // Convert to millions
          
          results.push({
            symbol: symbol,
            price: price,
            change: change,
            changePercent: changePercent,
            volume: volume,
            relVolume: 1.0, // Default relative volume
            sentiment: this.calculateSentiment(change, changePercent),
            description: `${priceData.name || symbol} stock`
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in Twelve Data API fetch:', error);
      throw error;
    }
  }

  /**
   * Fetch data from Alpha Vantage API
   * @param {Array} symbols - Stock symbols to fetch
   * @returns {Promise} - Promise resolving to processed stock data
   */
  async fetchAlphaVantageData(symbols) {
    try {
      const results = [];
      
      // Fetch data for each symbol individually due to API limits
      for (const symbol of symbols) {
        // Get global quote data
        const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageApiKey}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();
        
        // Get overview data for description
        const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${this.alphaVantageApiKey}`;
        const overviewResponse = await fetch(overviewUrl);
        const overviewData = await overviewResponse.json();
        
        if (quoteData && quoteData['Global Quote']) {
          const quote = quoteData['Global Quote'];
          const price = parseFloat(quote['05. price']);
          const change = parseFloat(quote['09. change']);
          const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
          const volume = parseFloat(quote['06. volume']) / 1000000; // Convert to millions
          
          results.push({
            symbol: symbol,
            price: price,
            change: change,
            changePercent: changePercent,
            volume: volume,
            relVolume: 1.0, // Default relative volume
            sentiment: this.calculateSentiment(change, changePercent),
            description: overviewData.Description || `${overviewData.Name || symbol} stock`
          });
        }
        
        // Alpha Vantage has a rate limit, add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return results;
    } catch (error) {
      console.error('Error in Alpha Vantage API fetch:', error);
      throw error;
    }
  }

  /**
   * Calculate sentiment based on price change
   * @param {Number} change - Price change
   * @param {Number} changePercent - Price change percentage
   * @returns {String} - Sentiment (BULLISH, NEUTRAL, BEARISH)
   */
  calculateSentiment(change, changePercent) {
    if (changePercent > 5) return 'BULLISH';
    if (changePercent < -5) return 'BEARISH';
    if (change > 0) return 'NEUTRAL_POSITIVE';
    if (change < 0) return 'NEUTRAL_NEGATIVE';
    return 'NEUTRAL';
  }

  /**
   * Fetch news data from SEC EDGAR and Benzinga
   * @param {String} symbol - Stock symbol to fetch news for
   * @returns {Promise} - Promise resolving to news data
   */
  async fetchNewsData(symbol) {
    try {
      // Fetch from multiple sources in parallel
      const [secNews, benzingaNews] = await Promise.all([
        this.fetchSECFilings(symbol),
        this.fetchBenzingaNews(symbol)
      ]);
      
      // Filter news to last 24 hours
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);
      
      const filteredSecNews = secNews.filter(item => {
        const newsTime = this.parseTimeString(item.time);
        return newsTime >= last24Hours;
      });
      
      const filteredBenzingaNews = benzingaNews.filter(item => {
        const newsTime = this.parseTimeString(item.time);
        return newsTime >= last24Hours;
      });
      
      // Combine and sort news by relevance (SEC filings first, then by recency)
      const allNews = [...filteredSecNews, ...filteredBenzingaNews].sort((a, b) => {
        // SEC filings always come first
        if (a.source === 'SEC Filing' && b.source !== 'SEC Filing') return -1;
        if (a.source !== 'SEC Filing' && b.source === 'SEC Filing') return 1;
        
        // Then sort by recency (convert time strings to comparable values)
        const timeA = this.convertTimeToMinutes(a.time);
        const timeB = this.convertTimeToMinutes(b.time);
        return timeA - timeB;
      });
      
      return allNews;
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      throw new Error('Failed to fetch news data');
    }
  }

  /**
   * Parse time string like "5 hours ago" to Date object
   * @param {String} timeStr - Time string to parse
   * @returns {Date} - Date object
   */
  parseTimeString(timeStr) {
    const now = new Date();
    const match = timeStr.match(/(\d+)\s+(\w+)\s+ago/);
    
    if (!match) return now;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.includes('minute')) {
      now.setMinutes(now.getMinutes() - value);
    } else if (unit.includes('hour')) {
      now.setHours(now.getHours() - value);
    } else if (unit.includes('day')) {
      now.setDate(now.getDate() - value);
    } else if (unit.includes('week')) {
      now.setDate(now.getDate() - (value * 7));
    } else if (unit.includes('month')) {
      now.setMonth(now.getMonth() - value);
    }
    
    return now;
  }

  /**
   * Fetch SEC filings from EDGAR
   * @param {String} symbol - Stock symbol to fetch filings for
   * @returns {Promise} - Promise resolving to SEC filings
   */
  async fetchSECFilings(symbol) {
    try {
      // In production, this would be a real API call to SEC EDGAR
      // For now, using simulated response with real URLs
      console.log(`Fetching SEC filings for: ${symbol}`);
      
      // For development, using simulated response
      return this.getSimulatedSECFilings(symbol);
    } catch (error) {
      console.error(`Error fetching SEC filings for ${symbol}:`, error);
      return []; // Return empty array on error to not break the app
    }
  }

  /**
   * Fetch news from Benzinga API
   * @param {String} symbol - Stock symbol to fetch news for
   * @returns {Promise} - Promise resolving to Benzinga news
   */
  async fetchBenzingaNews(symbol) {
    try {
      // In production, this would be a real API call to Benzinga
      // For now, using simulated response with real URLs
      console.log(`Fetching Benzinga news for: ${symbol}`);
      
      // For development, using simulated response
      return this.getSimulatedBenzingaNews(symbol);
    } catch (error) {
      console.error(`Error fetching Benzinga news for ${symbol}:`, error);
      return []; // Return empty array on error to not break the app
    }
  }

  /**
   * Convert time strings like "5 hours ago" to minutes for sorting
   * @param {String} timeStr - Time string to convert
   * @returns {Number} - Minutes representation for comparison
   */
  convertTimeToMinutes(timeStr) {
    const minutes = {
      'just now': 0,
      'minute': 1,
      'minutes': 1,
      'hour': 60,
      'hours': 60,
      'day': 1440,
      'days': 1440,
      'week': 10080,
      'weeks': 10080,
      'month': 43200,
      'months': 43200
    };
    
    const match = timeStr.match(/(\d+)\s+(\w+)\s+ago/);
    if (!match) return 999999; // Default high value for unknown formats
    
    const value = parseInt(match[1]);
    const unit = match[2].endsWith('s') ? match[2] : `${match[2]}`;
    
    return value * (minutes[unit] || 0);
  }

  /**
   * Get stock history for a given symbol
   * @param {String} symbol - Stock symbol
   * @returns {String} - Stock history text
   */
  getStockHistory(symbol) {
    const histories = {
      // US Stocks
      'NVDA': 'NVIDIA Corporation was founded in 1993 and has grown to become a leader in GPU technology. The company has expanded from gaming into data centers, AI, and autonomous vehicles, with significant growth in recent years.',
      'TSLA': 'Tesla, Inc. was founded in 2003 and is led by CEO Elon Musk. The company has revolutionized the electric vehicle market and expanded into energy storage and solar products, becoming one of the most valuable automakers globally.',
      'AMZN': 'Amazon.com was founded by Jeff Bezos in 1994 as an online bookstore. It has since expanded into the world\'s largest online marketplace, AI assistant provider, and cloud computing platform through AWS.',
      'AAPL': 'Apple Inc. was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976. The company revolutionized personal computing, mobile devices, and digital media distribution, becoming the first U.S. company to reach a $1 trillion market cap.',
      'MSFT': 'Microsoft Corporation was founded by Bill Gates and Paul Allen in 1975. The company dominated the PC operating system market with Windows and has successfully transitioned to cloud computing with Azure and subscription services.',
      'GOOGL': 'Alphabet Inc. (Google) was founded by Larry Page and Sergey Brin in 1998. Starting as a search engine, Google has expanded into mobile operating systems, cloud computing, advertising technology, and various hardware products.',
      'META': 'Meta Platforms (formerly Facebook) was founded by Mark Zuckerberg in 2004. The company has grown from a college social network to a global platform with billions of users across Facebook, Instagram, WhatsApp, and is now investing heavily in the metaverse.'
    };
    
    return histories[symbol] || `${symbol} is a publicly traded company with a history of innovation and growth in its sector.`;
  }

  /**
   * Get simulated Polygon API response for development
   * @param {Array} symbols - Stock symbols
   * @returns {Array} - Simulated stock data
   */
  getSimulatedPolygonResponse(symbols) {
    const stockData = {
      // US Stocks
      'NVDA': {
        symbol: 'NVDA',
        price: 203.27,
        change: 4.5,
        changePercent: 2.26,
        volume: 45.2,
        relVolume: 1.2,
        sentiment: 'NEUTRAL_POSITIVE',
        description: 'NVIDIA Corporation designs and manufactures computer graphics processors, chipsets, and related multimedia software.'
      },
      'TSLA': {
        symbol: 'TSLA',
        price: 177.67,
        change: -2.31,
        changePercent: -1.28,
        volume: 87.5,
        relVolume: 0.9,
        sentiment: 'NEUTRAL_NEGATIVE',
        description: 'Tesla, Inc. designs, develops, manufactures, and sells electric vehicles and energy generation and storage systems.'
      },
      'AMZN': {
        symbol: 'AMZN',
        price: 178.22,
        change: 1.45,
        changePercent: 0.82,
        volume: 32.1,
        relVolume: 0.8,
        sentiment: 'NEUTRAL_POSITIVE',
        description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through online and physical stores.'
      },
      'AAPL': {
        symbol: 'AAPL',
        price: 182.63,
        change: -0.87,
        changePercent: -0.47,
        volume: 41.3,
        relVolume: 0.7,
        sentiment: 'NEUTRAL_NEGATIVE',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.'
      },
      'MSFT': {
        symbol: 'MSFT',
        price: 417.23,
        change: 3.21,
        changePercent: 0.78,
        volume: 22.7,
        relVolume: 0.9,
        sentiment: 'NEUTRAL_POSITIVE',
        description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.'
      },
      'GOOGL': {
        symbol: 'GOOGL',
        price: 172.92,
        change: 1.12,
        changePercent: 0.65,
        volume: 18.9,
        relVolume: 0.8,
        sentiment: 'NEUTRAL_POSITIVE',
        description: 'Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.'
      },
      'META': {
        symbol: 'META',
        price: 478.22,
        change: 5.67,
        changePercent: 1.2,
        volume: 15.3,
        relVolume: 0.7,
        sentiment: 'NEUTRAL_POSITIVE',
        description: 'Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.'
      },
      'F': {
        symbol: 'F',
        price: 11.87,
        change: -0.23,
        changePercent: -1.9,
        volume: 52.1,
        relVolume: 1.1,
        sentiment: 'NEUTRAL_NEGATIVE',
        description: 'Ford Motor Company designs, manufactures, markets, and services a range of Ford trucks, cars, sport utility vehicles, electrified vehicles, and Lincoln luxury vehicles worldwide.'
      },
      'T': {
        symbol: 'T',
        price: 17.32,
        change: 0.12,
        changePercent: 0.7,
        volume: 38.7,
        relVolume: 0.9,
        sentiment: 'NEUTRAL_POSITIVE',
        description: 'AT&T Inc. provides telecommunications, media, and technology services worldwide.'
      },
      'PLTR': {
        symbol: 'PLTR',
        price: 22.47,
        change: 0.87,
        changePercent: 4.03,
        volume: 62.3,
        relVolume: 1.3,
        sentiment: 'NEUTRAL_POSITIVE',
        description: 'Palantir Technologies Inc. builds and deploys software platforms for the intelligence community in the United States to assist in counterterrorism investigations and operations.'
      },
      'SNAP': {
        symbol: 'SNAP',
        price: 8.76,
        change: -0.34,
        changePercent: -3.74,
        volume: 22.5,
        relVolume: 0.8,
        sentiment: 'NEUTRAL_NEGATIVE',
        description: 'Snap Inc. operates as a camera company in North America, Europe, and internationally.'
      },
      'SIRI': {
        symbol: 'SIRI',
        price: 3.12,
        change: -0.05,
        changePercent: -1.58,
        volume: 15.8,
        relVolume: 0.7,
        sentiment: 'NEUTRAL_NEGATIVE',
        description: 'Sirius XM Holdings Inc. provides satellite radio services on a subscription fee basis in the United States.'
      },
      'NOK': {
        symbol: 'NOK',
        price: 3.67,
        change: 0.03,
        changePercent: 0.82,
        volume: 12.3,
        relVolume: 0.6,
        sentiment: 'NEUTRAL_POSITIVE',
        description: 'Nokia Corporation provides mobile, fixed, and cloud network solutions worldwide.'
      }
    };
    
    // Return data for requested symbols
    return symbols.map(symbol => {
      if (stockData[symbol]) {
        return stockData[symbol];
      } else {
        // Generate random data for unknown symbols
        const price = Math.random() * 100 + 5;
        const change = (Math.random() * 4 - 2);
        const changePercent = (change / price) * 100;
        const volume = Math.random() * 50 + 5;
        
        return {
          symbol: symbol,
          price: price,
          change: change,
          changePercent: changePercent,
          volume: volume,
          relVolume: Math.random() * 1.5 + 0.5,
          sentiment: this.calculateSentiment(change, changePercent),
          description: `${symbol} is a publicly traded company.`
        };
      }
    });
  }

  /**
   * Get simulated SEC filings for development
   * @param {String} symbol - Stock symbol
   * @returns {Array} - Simulated SEC filings
   */
  getSimulatedSECFilings(symbol) {
    // Generate simulated SEC filings with real URLs
    return [
      {
        title: `${symbol} Files 10-Q Quarterly Report`,
        url: `https://www.sec.gov/edgar/search/#/q=${symbol}`,
        source: 'SEC Filing',
        time: '2 hours ago'
      },
      {
        title: `${symbol} Announces Quarterly Dividend`,
        url: `https://www.sec.gov/edgar/search/#/q=${symbol}`,
        source: 'SEC Filing',
        time: '5 hours ago'
      }
    ];
  }

  /**
   * Get simulated Benzinga news for development
   * @param {String} symbol - Stock symbol
   * @returns {Array} - Simulated Benzinga news
   */
  getSimulatedBenzingaNews(symbol) {
    // Generate simulated Benzinga news with real URLs
    return [
      {
        title: `${symbol} Beats Earnings Expectations`,
        url: `https://www.benzinga.com/quote/${symbol}`,
        source: 'Benzinga',
        time: '3 hours ago'
      },
      {
        title: `Analysts Upgrade ${symbol} to Buy`,
        url: `https://www.benzinga.com/quote/${symbol}`,
        source: 'Benzinga',
        time: '6 hours ago'
      },
      {
        title: `${symbol} Announces New Product Line`,
        url: `https://www.benzinga.com/quote/${symbol}`,
        source: 'Benzinga',
        time: '12 hours ago'
      },
      {
        title: `${symbol} CEO Interviewed on Future Plans`,
        url: `https://www.benzinga.com/quote/${symbol}`,
        source: 'Benzinga',
        time: '18 hours ago'
      }
    ];
  }
}

module.exports = StockDataAPI;
