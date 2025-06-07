const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const stockScanner = require('./stockScanner');
const newsRelevance = require('./newsRelevance');
const fetch = require('node-fetch');
const OpenAI = require('openai');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3000;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const TWELVE_API_KEY = process.env.TWELVE_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint to fetch stocks with fixed filters (2-30 dollars, 1M+ volume)
app.get('/api/stocks', async (req, res) => {
  try {
    // Apenas o limite é configurável, filtros são fixos
    const limit = parseInt(req.query.limit) || 20;

    console.log(`Fetching stocks with fixed filters: $2-30, volume >1M, limit: ${limit}`);
    
    const data = await stockScanner({ limit });
    
    console.log(`Returning ${data.length} stocks ordered by VOLUME (highest first)`);
    res.json(data);
  } catch (err) {
    console.error('Error in /api/stocks:', err.message);
    res.status(500).json({ error: 'Failed to fetch stock data.' });
  }
});

// Endpoint to fetch historical price data for charts
app.get('/api/chart/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    // Get date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${formatDate(startDate)}/${formatDate(endDate)}?adjusted=true&sort=asc&apikey=${POLYGON_API_KEY}`;
    
    console.log(`Fetching chart data for ${symbol}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      // Generate mock data if no real data available
      const mockData = generateMockChartData(30);
      return res.json({
        symbol: symbol,
        data: mockData
      });
    }
    
    // Format data for Chart.js
    const chartData = data.results.map(item => ({
      date: new Date(item.t).toISOString().split('T')[0],
      price: item.c, // closing price
      volume: item.v,
      high: item.h,
      low: item.l,
      open: item.o
    }));
    
    res.json({
      symbol: symbol,
      data: chartData
    });
    
  } catch (err) {
    console.error(`Error fetching chart data for ${symbol}:`, err.message);
    
    // Return mock data on error
    const mockData = generateMockChartData(30);
    res.json({
      symbol: symbol,
      data: mockData
    });
  }
});

// Function to generate mock chart data
function generateMockChartData(days) {
  const data = [];
  let basePrice = 5 + Math.random() * 20; // Random price between 5-25
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate price movement
    const change = (Math.random() - 0.5) * 2; // -1 to +1
    basePrice = Math.max(2, Math.min(30, basePrice + change)); // Keep within 2-30 range
    
    const volume = Math.floor(1000000 + Math.random() * 50000000); // 1M to 51M
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(basePrice.toFixed(2)),
      volume: volume,
      high: parseFloat((basePrice * 1.05).toFixed(2)),
      low: parseFloat((basePrice * 0.95).toFixed(2)),
      open: parseFloat((basePrice + (Math.random() - 0.5)).toFixed(2))
    });
  }
  
  return data;
}

// Real news endpoint
app.get('/api/news/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const url = `https://newsapi.org/v2/everything?q=${symbol}&language=en&sortBy=publishedAt&apiKey=9f10f4c679014a7dbdb67d5c4a2c0c9a`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      return res.json([{ 
        title: `No recent news found for ${symbol}`, 
        url: `https://finance.yahoo.com/quote/${symbol}`, 
        source: "Yahoo Finance", 
        publishedAt: new Date().toISOString() 
      }]);
    }

    // Limitar a 3-4 notícias mais relevantes
    const recentNews = data.articles
      .slice(0, 4)
      .map(article => ({
        title: article.title,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt
      }));

    res.json(recentNews);
  } catch (err) {
    console.error('Error in /api/news:', err.message);
    res.status(500).json({ error: 'Failed to fetch news.' });
  }
});

// Polygon News endpoint
app.get('/api/news/polygon/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  try {
    console.log(`Fetching Polygon news for ${symbol}`);
    
    const url = `https://api.polygon.io/v2/reference/news?ticker=${symbol}&limit=5&apikey=${POLYGON_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const formattedNews = data.results.map(article => ({
        title: article.title,
        url: article.article_url,
        publishedAt: article.published_utc,
        source: article.publisher?.name || 'Polygon',
        description: article.description
      }));
      
      res.json(formattedNews);
    } else {
      res.json([]);
    }
    
  } catch (err) {
    console.error('Error fetching Polygon news:', err.message);
    res.status(500).json({ error: 'Failed to fetch Polygon news.' });
  }
});

// Twelve Data News endpoint
app.get('/api/news/twelve/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  try {
    console.log(`Fetching Twelve Data news for ${symbol}`);
    
    const url = `https://api.twelvedata.com/news?symbol=${symbol}&apikey=${TWELVE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Twelve Data API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const formattedNews = data.data.map(article => ({
        title: article.title,
        url: article.url,
        publishedAt: article.datetime,
        source: article.source || 'Twelve Data',
        description: article.content
      }));
      
      res.json(formattedNews);
    } else {
      res.json([]);
    }
    
  } catch (err) {
    console.error('Error fetching Twelve Data news:', err.message);
    res.status(500).json({ error: 'Failed to fetch Twelve Data news.' });
  }
});

// Alpha Vantage News endpoint
app.get('/api/news/alpha/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  try {
    console.log(`Fetching Alpha Vantage news for ${symbol}`);
    
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.feed && data.feed.length > 0) {
      const formattedNews = data.feed.slice(0, 5).map(article => ({
        title: article.title,
        url: article.url,
        publishedAt: article.time_published,
        source: article.source || 'Alpha Vantage',
        description: article.summary,
        sentiment: article.overall_sentiment_label
      }));
      
      res.json(formattedNews);
    } else {
      res.json([]);
    }
    
  } catch (err) {
    console.error('Error fetching Alpha Vantage news:', err.message);
    res.status(500).json({ error: 'Failed to fetch Alpha Vantage news.' });
  }
});

// ChatGPT endpoint for general conversation
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  
  try {
    console.log('ChatGPT request received');
    
    // Try OpenAI first
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content.trim();
      
      return res.json({
        response: response,
        timestamp: new Date().toISOString()
      });
      
    } catch (openaiError) {
      console.log('OpenAI unavailable, using intelligent fallback:', openaiError.message);
      
      // Intelligent fallback system
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      const response = generateChatResponse(lastUserMessage);
      
      res.json({
        response: response,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (err) {
    console.error('Error in chat:', err.message);
    
    // Final fallback
    res.json({
      response: "I'm having some technical difficulties right now. Please try again in a moment, or feel free to ask me about stocks, trading, or market analysis!",
      timestamp: new Date().toISOString()
    });
  }
});

// Generate intelligent chat responses
function generateChatResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm here to help you with any questions about stocks, trading, market analysis, or anything else you'd like to discuss. What's on your mind?";
  }
  
  // Stock-related questions
  if (lowerMessage.includes('stock') || lowerMessage.includes('trading') || lowerMessage.includes('market')) {
    return "I'd be happy to help with stock and market questions! I can discuss trading strategies, market analysis, risk management, technical indicators, and general investment concepts. What specific aspect would you like to explore?";
  }
  
  // Technical analysis
  if (lowerMessage.includes('technical') || lowerMessage.includes('chart') || lowerMessage.includes('indicator')) {
    return "Technical analysis is a fascinating field! It involves studying price charts, volume patterns, and various indicators to identify potential trading opportunities. Some popular indicators include moving averages, RSI, MACD, and Bollinger Bands. What specific technical concept interests you?";
  }
  
  // Risk management
  if (lowerMessage.includes('risk') || lowerMessage.includes('loss') || lowerMessage.includes('manage')) {
    return "Risk management is crucial in trading and investing. Key principles include position sizing, stop-losses, diversification, and never risking more than you can afford to lose. The general rule is to risk no more than 1-2% of your capital on any single trade. Would you like to discuss specific risk management strategies?";
  }
  
  // Investment advice disclaimer
  if (lowerMessage.includes('should i buy') || lowerMessage.includes('should i sell') || lowerMessage.includes('invest in')) {
    return "I can't provide specific investment advice, but I can help you understand the factors to consider when making investment decisions. These include fundamental analysis, technical analysis, your risk tolerance, investment timeline, and overall portfolio strategy. What aspects of investment decision-making would you like to explore?";
  }
  
  // General market questions
  if (lowerMessage.includes('market') || lowerMessage.includes('economy') || lowerMessage.includes('finance')) {
    return "Financial markets are complex systems influenced by many factors including economic data, corporate earnings, geopolitical events, and investor sentiment. Understanding these dynamics can help in making informed decisions. What specific market topic interests you?";
  }
  
  // Learning resources
  if (lowerMessage.includes('learn') || lowerMessage.includes('beginner') || lowerMessage.includes('start')) {
    return "Great that you're interested in learning! For beginners, I recommend starting with the basics: understanding different asset classes, risk vs. return, the importance of diversification, and basic financial statements. Books like 'The Intelligent Investor' and 'A Random Walk Down Wall Street' are excellent starting points. What area would you like to focus on first?";
  }
  
  // Thank you responses
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return "You're very welcome! I'm here whenever you need help with financial questions or want to discuss market topics. Feel free to ask me anything!";
  }
  
  // Default response
  return "That's an interesting question! I'm here to help with a wide range of topics, especially anything related to stocks, trading, and financial markets. Could you provide a bit more context so I can give you a more specific and helpful response?";
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Stock Beacon server is running on port ${PORT}`);
  console.log(`📊 Stock filters: $2-30, Volume >1M, Ordered by VOLUME`);
  console.log(`🌐 Health check: /health`);
  console.log(`📈 API endpoint: /api/stocks`);
});

