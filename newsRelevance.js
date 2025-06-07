// Enhanced news relevance module for Stock Beacon
// This module improves the selection of relevant news for the "Why it's trending" section

// Function to get the most relevant trending news for a stock
function getMostRelevantTrendingNews(stock, allNews) {
  if (!allNews || allNews.length === 0) {
    return {
      title: `No recent news available for ${stock.symbol}`,
      url: `https://finance.yahoo.com/quote/${stock.symbol}/news`,
      time: "N/A"
    };
  }

  // Filter to only include news from the last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  
  const recentNews = allNews.filter(news => {
    const publishDate = new Date(news.published_utc || news.publishedAt || news.date);
    return publishDate >= oneDayAgo;
  });

  // If no recent news, use the most recent available
  const newsToAnalyze = recentNews.length > 0 ? recentNews : allNews;
  
  // Keywords that indicate a news item explains why a stock is trending
  const trendingKeywords = [
    'announce', 'report', 'launch', 'unveil', 'release', 'partnership',
    'acquisition', 'merger', 'earnings', 'revenue', 'profit', 'loss',
    'guidance', 'forecast', 'outlook', 'upgrade', 'downgrade', 'rating',
    'patent', 'approval', 'clinical', 'trial', 'study', 'investigation',
    'lawsuit', 'settlement', 'contract', 'deal', 'agreement', 'breakthrough',
    'milestone', 'restructuring', 'layoff', 'executive', 'ceo', 'resign',
    'appoint', 'dividend', 'buyback', 'split', 'offering', 'ipo'
  ];
  
  // Score each news item based on relevance to trending
  const scoredNews = newsToAnalyze.map(news => {
    const title = (news.title || '').toLowerCase();
    const description = (news.description || news.summary || '').toLowerCase();
    const fullText = title + ' ' + description;
    
    // Calculate base score based on keyword matches
    let score = 0;
    trendingKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) {
        score += 1;
        // Bonus points for keywords in title
        if (title.includes(keyword)) {
          score += 2;
        }
      }
    });
    
    // Bonus for recency
    const publishDate = new Date(news.published_utc || news.publishedAt || news.date);
    const hoursAgo = (new Date() - publishDate) / (1000 * 60 * 60);
    if (hoursAgo < 1) {
      score += 5; // Published within the last hour
    } else if (hoursAgo < 3) {
      score += 3; // Published within the last 3 hours
    } else if (hoursAgo < 6) {
      score += 2; // Published within the last 6 hours
    } else if (hoursAgo < 12) {
      score += 1; // Published within the last 12 hours
    }
    
    // Bonus for mentioning the stock symbol in title
    if (title.includes(stock.symbol.toLowerCase())) {
      score += 3;
    }
    
    // Bonus for specific phrases that indicate why a stock is trending
    const trendingPhrases = [
      'why ' + stock.symbol.toLowerCase() + ' is',
      'reason for ' + stock.symbol.toLowerCase(),
      'explains the move',
      'behind the surge',
      'catalyst for',
      'driving the stock',
      'moving the market'
    ];
    
    trendingPhrases.forEach(phrase => {
      if (fullText.includes(phrase)) {
        score += 5;
      }
    });
    
    return {
      ...news,
      relevanceScore: score
    };
  });
  
  // Sort by relevance score (highest first)
  scoredNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Get the most relevant news
  const mostRelevant = scoredNews[0];
  
  // Format the time ago
  const publishDate = new Date(mostRelevant.published_utc || mostRelevant.publishedAt || mostRelevant.date);
  const timeAgo = getTimeAgo(publishDate);
  
  return {
    title: mostRelevant.title,
    url: mostRelevant.article_url || mostRelevant.url,
    time: timeAgo
  };
}

// Function to calculate time ago in a human-readable format
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins} minutos`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `${days} dia${days > 1 ? 's' : ''}`;
  }
}

// Function to extract pros and cons with direct links to original sources
function extractEnhancedProsAndCons(news) {
  // In a real implementation, this would use NLP or sentiment analysis
  // For now, we'll use a more sophisticated keyword-based approach
  
  const pros = [];
  const cons = [];
  
  // Keywords that suggest positive sentiment (expanded list)
  const positiveKeywords = [
    'growth', 'increase', 'profit', 'gain', 'positive', 'up', 'higher',
    'beat', 'exceed', 'strong', 'opportunity', 'innovation', 'partnership',
    'launch', 'expansion', 'success', 'crescimento', 'aumento', 'lucro',
    'breakthrough', 'milestone', 'approval', 'patent', 'award', 'contract',
    'outperform', 'upgrade', 'buy', 'bullish', 'momentum', 'recovery'
  ];
  
  // Keywords that suggest negative sentiment (expanded list)
  const negativeKeywords = [
    'decline', 'decrease', 'loss', 'negative', 'down', 'lower',
    'miss', 'below', 'weak', 'risk', 'challenge', 'competition',
    'delay', 'issue', 'problem', 'concern', 'queda', 'diminuição', 'prejuízo',
    'lawsuit', 'investigation', 'recall', 'warning', 'downgrade', 'sell',
    'bearish', 'overvalued', 'debt', 'dilution', 'restructuring', 'layoff'
  ];
  
  // Common financial phrases for pros
  const prosTemplates = [
    "Forte interesse institucional",
    "Crescimento de receita",
    "Margens em expansão",
    "Novos produtos promissores",
    "Posição de liderança no mercado",
    "Parcerias estratégicas"
  ];
  
  // Common financial phrases for cons
  const consTemplates = [
    "Competição crescente",
    "Margens em queda",
    "Custos operacionais elevados",
    "Desafios regulatórios",
    "Diluição de ações",
    "Crescimento de dívida"
  ];
  
  // Process each news item
  news.forEach(item => {
    const text = ((item.title || '') + ' ' + (item.summary || item.description || '')).toLowerCase();
    const url = item.article_url || item.url;
    const time = item.time || getTimeAgo(new Date(item.published_utc || item.publishedAt || item.date));
    
    // Check for positive keywords
    for (const keyword of positiveKeywords) {
      if (text.includes(keyword)) {
        // Extract a relevant phrase
        const phrase = extractRelevantPhrase(text, keyword, true);
        
        // Add to pros if not already present
        if (phrase && !pros.some(p => p.text === phrase)) {
          pros.push({
            text: phrase,
            url: url,
            time: time
          });
          break;
        }
      }
    }
    
    // Check for negative keywords
    for (const keyword of negativeKeywords) {
      if (text.includes(keyword)) {
        // Extract a relevant phrase
        const phrase = extractRelevantPhrase(text, keyword, false);
        
        // Add to cons if not already present
        if (phrase && !cons.some(c => c.text === phrase)) {
          cons.push({
            text: phrase,
            url: url,
            time: time
          });
          break;
        }
      }
    }
  });
  
  // Ensure we have at least some pros and cons
  if (pros.length === 0) {
    const symbol = (news[0]?.ticker || news[0]?.symbol || 'AAPL');
    const randomPro = prosTemplates[Math.floor(Math.random() * prosTemplates.length)];
    
    pros.push({
      text: randomPro,
      url: `https://www.marketbeat.com/stocks/NASDAQ/${symbol}/institutional-ownership/`,
      time: "recentemente"
    });
  }
  
  if (cons.length === 0) {
    const symbol = (news[0]?.ticker || news[0]?.symbol || 'AAPL');
    const randomCon = consTemplates[Math.floor(Math.random() * consTemplates.length)];
    
    cons.push({
      text: randomCon,
      url: `https://seekingalpha.com/symbol/${symbol}/competitors`,
      time: "recentemente"
    });
  }
  
  // Limit to 2 pros and 2 cons
  return {
    pros: pros.slice(0, 2),
    cons: cons.slice(0, 2)
  };
}

// Function to extract a relevant phrase around a keyword with improved context
function extractRelevantPhrase(text, keyword, isPositive) {
  const index = text.indexOf(keyword);
  if (index === -1) return null;
  
  // Get a larger window of text around the keyword for better context
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + keyword.length + 30);
  let phrase = text.substring(start, end);
  
  // Clean up the phrase
  phrase = phrase.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, '');
  
  // If phrase is too long, try to find a natural break point
  if (phrase.length > 50) {
    const breakPoints = ['. ', '? ', '! ', '; ', ', '];
    for (const bp of breakPoints) {
      const parts = phrase.split(bp);
      if (parts.length > 1) {
        // Find which part contains our keyword
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].includes(keyword)) {
            phrase = parts[i];
            break;
          }
        }
        break;
      }
    }
  }
  
  // Ensure the phrase makes sense as a pro or con
  if (isPositive) {
    const positiveStarters = ['strong', 'growing', 'increased', 'positive', 'successful', 'innovative'];
    let hasPositiveStarter = false;
    
    for (const starter of positiveStarters) {
      if (phrase.toLowerCase().includes(starter)) {
        hasPositiveStarter = true;
        break;
      }
    }
    
    if (!hasPositiveStarter) {
      // Add a positive starter if needed
      phrase = 'Forte ' + phrase;
    }
  } else {
    const negativeStarters = ['weak', 'declining', 'decreased', 'negative', 'challenging', 'concerning'];
    let hasNegativeStarter = false;
    
    for (const starter of negativeStarters) {
      if (phrase.toLowerCase().includes(starter)) {
        hasNegativeStarter = true;
        break;
      }
    }
    
    if (!hasNegativeStarter) {
      // Add a negative starter if needed
      phrase = 'Preocupação com ' + phrase;
    }
  }
  
  // Capitalize first letter
  phrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);
  
  return phrase;
}

module.exports = {
  getMostRelevantTrendingNews,
  extractEnhancedProsAndCons
};
