require('dotenv').config();
const axios = require('axios');

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

const safeGetPrice = (ticker) => {
  try {
    if (ticker.last?.trade?.price) return ticker.last.trade.price;
    if (ticker.lastTrade?.p) return ticker.lastTrade.p;
    if (ticker.day?.c) return ticker.day.c;
    if (ticker.prevDay?.c) return ticker.prevDay.c;
    if (ticker.close) return ticker.close;
    if (ticker.c) return ticker.c;
    return 0;
  } catch {
    return 0;
  }
};

const safeGetVolume = (ticker) => {
  try {
    if (ticker.volume) return ticker.volume;
    if (ticker.v) return ticker.v;
    if (ticker.day?.v) return ticker.day.v;
    if (ticker.prevDay?.v) return ticker.prevDay.v;
    if (ticker.last?.trade?.size) return ticker.last.trade.size;
    return 0;
  } catch {
    return 0;
  }
};

// Função para buscar notícias recentes de um stock
const getRecentNews = async (symbol) => {
  try {
    // Buscar notícias dos últimos 7 dias
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fromDate = weekAgo.toISOString().split('T')[0];
    
    const newsUrl = `https://api.polygon.io/v2/reference/news?ticker=${symbol}&published_utc.gte=${fromDate}&limit=5&apikey=${POLYGON_API_KEY}`;
    const response = await axios.get(newsUrl);
    
    if (response.data.results && response.data.results.length > 0) {
      // Retornar a notícia mais recente
      const mostRecent = response.data.results[0];
      const publishedDate = new Date(mostRecent.published_utc);
      const hoursAgo = Math.floor((today - publishedDate) / (1000 * 60 * 60));
      
      return {
        title: mostRecent.title,
        url: mostRecent.article_url,
        hoursAgo: hoursAgo,
        hasRecentNews: hoursAgo < 48 // Notícias dos últimos 2 dias
      };
    }
    
    return {
      title: `No recent news found for ${symbol}`,
      url: '#',
      hoursAgo: 999,
      hasRecentNews: false
    };
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error.message);
    return {
      title: `No recent news found for ${symbol}`,
      url: '#',
      hoursAgo: 999,
      hasRecentNews: false
    };
  }
};

// Função para calcular score de relevância baseado em volume e notícias recentes
const calculateRelevanceScore = (ticker, newsData = null) => {
  const volume = safeGetVolume(ticker);
  const price = safeGetPrice(ticker);
  
  // Score baseado no volume (peso maior - 60%)
  const volumeScore = Math.log10(volume + 1) * 15;
  
  // Score baseado na mudança de preço (volatilidade - 20%)
  const priceChange = ticker.day?.c && ticker.prevDay?.c ? 
    Math.abs((ticker.day.c - ticker.prevDay.c) / ticker.prevDay.c) * 100 : 0;
  const volatilityScore = priceChange * 3;
  
  // Score baseado no volume relativo (10%)
  const relativeVolumeScore = ticker.day?.v && ticker.prevDay?.v ?
    (ticker.day.v / ticker.prevDay.v) * 5 : 5;
  
  // Score baseado na recência das notícias (10%)
  let newsScore = 0;
  if (newsData) {
    if (newsData.hasRecentNews) {
      // Notícias mais recentes têm score maior
      newsScore = Math.max(0, 10 - (newsData.hoursAgo / 24));
    }
  }
  
  // Score determinístico baseado no símbolo para consistência
  const symbolScore = ticker.ticker ? 
    ticker.ticker.charCodeAt(0) * 0.01 : 0;
  
  return volumeScore + volatilityScore + relativeVolumeScore + newsScore + symbolScore;
};

const stockScanner = async ({ limit = 20 } = {}) => {
  try {
    // Filtros fixos: preço entre $2-30, volume mínimo 1M
    const minPrice = 2;
    const maxPrice = 30;
    const minVolume = 1000000; // 1 milhão
    
    console.log(`Fetching stocks with fixed filters: $${minPrice}-${maxPrice}, volume >${minVolume/1000000}M, limit: ${limit}`);
    
    const snapshotUrl = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=${POLYGON_API_KEY}`;
    const snapshotRes = await axios.get(snapshotUrl);

    const filtered = snapshotRes.data.tickers
      .filter(ticker => {
        const price = safeGetPrice(ticker);
        const volume = safeGetVolume(ticker);
        return (
          price >= minPrice &&
          price <= maxPrice &&
          volume >= minVolume &&
          ticker.ticker && // Garantir que tem símbolo
          !ticker.ticker.includes('.') && // Evitar warrants e outros derivativos
          ticker.ticker.length <= 5 // Símbolos normais
        );
      });

    // NOVA LÓGICA: Ordenar SEMPRE por volume máximo decrescente
    console.log(`Sorting ALL stocks by volume (descending) before limiting to ${limit}`);
    
    const sortedByVolume = filtered
      .sort((a, b) => {
        const volumeA = safeGetVolume(a);
        const volumeB = safeGetVolume(b);
        
        // Ordenação primária: volume decrescente
        if (volumeB !== volumeA) {
          return volumeB - volumeA;
        }
        
        // Ordenação secundária: símbolo alfabético para consistência
        return a.ticker.localeCompare(b.ticker);
      })
      .slice(0, limit); // Pegar apenas os primeiros N com maior volume

    // Buscar notícias apenas para os stocks selecionados
    const stocksWithNews = await Promise.all(
      sortedByVolume.map(async (ticker) => {
        const newsData = await getRecentNews(ticker.ticker);
        
        return {
          ...ticker,
          newsData
        };
      })
    );

    console.log(`Returning ${stocksWithNews.length} stocks ordered by VOLUME (highest first)`);

    return stocksWithNews.map(ticker => {
      const symbol = ticker.ticker || "UNKNOWN";
      const price = safeGetPrice(ticker);
      const volume = safeGetVolume(ticker);
      
      return {
        symbol,
        price,
        volume,
        name: symbol,
        priceChange: ticker.day?.c && ticker.prevDay?.c ? 
          ticker.day.c - ticker.prevDay.c : 0,
        percentChange: ticker.day?.c && ticker.prevDay?.c ? 
          ((ticker.day.c - ticker.prevDay.c) / ticker.prevDay.c) * 100 : 0,
        newsData: ticker.newsData
      };
    });
  } catch (err) {
    console.error('Error in stockScanner:', err.message);
    throw err;
  }
};

module.exports = stockScanner;

