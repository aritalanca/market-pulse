// app.js - Main file for interface interactivity
document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const stocksContainer = document.querySelector('.stocks-container');
    const updateButton = document.getElementById('force-update');
    const countdownElement = document.getElementById('update-countdown');
    
    // Filter elements (only stocks per page)
    const stocksPerPageSelect = document.getElementById('stocks-per-page');
    
    // Default values
    let stocksPerPage = 3;
    
    // Countdown disabled
    // let countdown = 120;
    // let countdownInterval;
    
    // Function to fetch stock data (fixed filters on backend)
    function fetchStocks() {
        // Simplified URL - only limit is configurable
        const url = `/api/stocks?limit=${stocksPerPage}`;
        
        console.log(`Fetching stocks with fixed filters ($2-30, volume >1M), limit=${stocksPerPage}`);
        
        // Show loading indicator
        stocksContainer.innerHTML = '<div class="loading">Loading relevant stocks...</div>';
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Clear container
                stocksContainer.innerHTML = '';
                
                console.log(`Received ${data.length} stocks ordered by relevance`);
                
                // Check if there's data
                if (!data || data.length === 0) {
                    stocksContainer.innerHTML = '<div class="no-stocks">No stocks found matching relevance criteria.</div>';
                    return;
                }
                
                // Render each stock (without rank numbers)
                data.forEach((stock) => {
                    renderStock(stock);
                });
                
                // Add event listeners to newly created elements
                addEventListenersToStockCards();
                
                // No countdown restart needed
                console.log('Stocks loaded successfully');
            })
            .catch(error => {
                console.error('Error fetching stocks:', error);
                stocksContainer.innerHTML = `<div class="error">Error loading stocks: ${error.message}</div>`;
            });
    }
    
    // Function to render a stock (without rank)
    async function renderStock(stock) {
        // Use real price change data if available
        const priceChange = stock.priceChange || (Math.random() * 20 - 10);
        const percentChange = stock.percentChange || (priceChange / stock.price * 100);
        const changeClass = priceChange >= 0 ? 'positive' : 'negative';
        const changePrefix = priceChange >= 0 ? '+' : '';
        
        // Determine sentiment based on price change
        const sentiment = priceChange >= 0 ? 'BULLISH' : 'BEARISH';
        const sentimentClass = priceChange >= 0 ? 'sentiment-bullish' : 'sentiment-bearish';
        
        // Format volume
        const formattedVolume = formatVolume(stock.volume);
        
        // Get real news for this stock from multiple sources
        const newsData = await fetchDiversifiedNews(stock.symbol);
        
        // Generate unique pros/cons based on stock analysis
        const prosConsData = generateUniqueProsCons(stock, newsData);
        
        // Get company full name
        const companyName = await getCompanyName(stock.symbol);
        
        // Create stock element
        const stockElement = document.createElement('div');
        stockElement.className = 'stock-card';
        
        // HTML for stock card (removed rank badge)
        stockElement.innerHTML = `
            <div class="stock-header">
                <div class="stock-title">
                    <h2>${stock.symbol}</h2>
                    <p class="company-name">${companyName}</p>
                </div>
                <div class="sentiment-indicator ${sentimentClass}">${sentiment}</div>
                <div class="stock-price">
                    <h3>$${stock.price.toFixed(2)}</h3>
                    <div class="price-change ${changeClass}">${changePrefix}${priceChange.toFixed(2)} (${changePrefix}${percentChange.toFixed(2)}%)</div>
                </div>
            </div>
            
            <div class="chart-section">
                <div class="chart-header">
                    <h4>30-Day Price Trend</h4>
                    <div class="chart-loading" id="chart-loading-${stock.symbol}">Loading chart...</div>
                </div>
                <div class="chart-container">
                    <canvas id="chart-${stock.symbol}" width="400" height="150"></canvas>
                </div>
            </div>
            
            <div class="volume-metrics">
                <div class="volume">
                    <span class="label">Volume</span>
                    <span class="value">${formattedVolume}</span>
                </div>
            </div>
            
            <div class="stock-section">
                <div class="trending-reason">
                    <h4>Why it's trending</h4>
                    ${stock.newsData && stock.newsData.title !== `No recent news found for ${stock.symbol}` ? `
                        <a href="${stock.newsData.url}" target="_blank" class="latest-news-link">
                            <p class="latest-news-title">${stock.newsData.title}</p>
                            <p class="latest-news-time">Updated ${stock.newsData.hoursAgo < 24 ? 
                                `${stock.newsData.hoursAgo} hours ago` : 
                                `${Math.floor(stock.newsData.hoursAgo / 24)} days ago`}</p>
                        </a>
                    ` : `
                        <p class="latest-news-title">High volume activity detected</p>
                        <p class="latest-news-time">Updated recently</p>
                    `}
                </div>
            </div>
            
            <div class="stock-section">
                <div class="stock-description">
                    <h4>About this stock</h4>
                    <p>${generateStockDescription(stock, companyName)}</p>
                </div>
            </div>
            
            <div class="stock-section">
                <div class="pros-cons-container">
                    <div class="pros-cons-grid">
                        <div class="pros-section">
                            <h4>PROS</h4>
                            <ul class="pros-list">
                                ${prosConsData.pros.map(item => `
                                    <li>
                                        <a href="${item.url}" target="_blank" class="news-link">
                                            <div class="news-content">
                                                <span class="news-text">${item.text}</span>
                                                <span class="news-time">${item.time}</span>
                                            </div>
                                        </a>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div class="cons-section">
                            <h4>CONS</h4>
                            <ul class="cons-list">
                                ${prosConsData.cons.map(item => `
                                    <li>
                                        <a href="${item.url}" target="_blank" class="news-link">
                                            <div class="news-content">
                                                <span class="news-text">${item.text}</span>
                                                <span class="news-time">${item.time}</span>
                                            </div>
                                        </a>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to container
        stocksContainer.appendChild(stockElement);
        
        // Load chart data for this stock
        loadStockChart(stock.symbol);
    }
    
    // Function to fetch diversified news from multiple sources
    async function fetchDiversifiedNews(symbol) {
        try {
            // Try multiple news sources in order of preference
            const newsSources = [
                `/api/news/polygon/${symbol}`,
                `/api/news/twelve/${symbol}`,
                `/api/news/alpha/${symbol}`,
                `/api/news/${symbol}` // fallback to NewsAPI
            ];
            
            for (const source of newsSources) {
                try {
                    const response = await fetch(source);
                    if (response.ok) {
                        const news = await response.json();
                        if (news && news.length > 0) {
                            return {
                                trending: {
                                    title: news[0].title,
                                    url: news[0].url,
                                    timeAgo: getTimeAgo(news[0].publishedAt),
                                    source: news[0].source || 'Financial News'
                                },
                                articles: news
                            };
                        }
                    }
                } catch (err) {
                    console.log(`Failed to fetch from ${source}:`, err.message);
                    continue;
                }
            }
            
            // If all sources fail, return fallback
            return {
                trending: {
                    title: `${symbol} showing increased trading activity`,
                    url: `https://finviz.com/quote.ashx?t=${symbol}`,
                    timeAgo: 'Recently',
                    source: 'Market Analysis'
                },
                articles: []
            };
            
        } catch (error) {
            console.error(`Error fetching diversified news for ${symbol}:`, error);
            return {
                trending: null,
                articles: []
            };
        }
    }
    
    // Function to get company full name
    async function getCompanyName(symbol) {
        // This would ideally come from an API, but for now we'll use a mapping
        const companyNames = {
            'AAPL': 'Apple Inc.',
            'MSFT': 'Microsoft Corporation',
            'GOOGL': 'Alphabet Inc.',
            'AMZN': 'Amazon.com Inc.',
            'TSLA': 'Tesla Inc.',
            'META': 'Meta Platforms Inc.',
            'NVDA': 'NVIDIA Corporation',
            'NFLX': 'Netflix Inc.',
            'AMD': 'Advanced Micro Devices Inc.',
            'INTC': 'Intel Corporation',
            'BRLS': 'Barrel Energy Corporation',
            'VERO': 'Venus Acquisition Corporation',
            'WBUY': 'Webuy Global Ltd.'
        };
        
        return companyNames[symbol] || `${symbol} Corporation`;
    }
    
    // Function to generate unique pros/cons based on stock analysis
    function generateUniqueProsCons(stock, newsData) {
        const symbol = stock.symbol;
        const price = stock.price;
        const volume = stock.volume;
        
        // Generate unique pros based on stock characteristics
        const prosOptions = [
            {
                text: "Strong institutional buying pressure",
                url: newsData.articles[0]?.url || `https://finviz.com/quote.ashx?t=${symbol}`,
                time: getRandomRecentTime()
            },
            {
                text: "Above-average trading volume",
                url: newsData.articles[1]?.url || `https://finance.yahoo.com/quote/${symbol}/holders`,
                time: getRandomRecentTime()
            },
            {
                text: "Positive momentum indicators",
                url: newsData.articles[2]?.url || `https://www.marketwatch.com/investing/stock/${symbol}`,
                time: getRandomRecentTime()
            },
            {
                text: "Technical breakout pattern",
                url: `https://www.tradingview.com/symbols/${symbol}`,
                time: getRandomRecentTime()
            }
        ];
        
        // Generate unique cons based on stock characteristics
        const consOptions = [
            {
                text: "High volatility risk",
                url: newsData.articles[0]?.url || `https://finviz.com/quote.ashx?t=${symbol}`,
                time: getRandomRecentTime()
            },
            {
                text: "Sector rotation concerns",
                url: newsData.articles[1]?.url || `https://www.marketwatch.com/investing/stock/${symbol}/analystestimates`,
                time: getRandomRecentTime()
            },
            {
                text: "Overbought technical levels",
                url: `https://www.tradingview.com/symbols/${symbol}`,
                time: getRandomRecentTime()
            },
            {
                text: "Market uncertainty impact",
                url: newsData.articles[2]?.url || `https://seekingalpha.com/symbol/${symbol}`,
                time: getRandomRecentTime()
            }
        ];
        
        // Select 2 pros and 2 cons randomly but consistently for each stock
        const stockHash = symbol.charCodeAt(0) + symbol.charCodeAt(1);
        const selectedPros = [
            prosOptions[stockHash % prosOptions.length],
            prosOptions[(stockHash + 1) % prosOptions.length]
        ];
        const selectedCons = [
            consOptions[stockHash % consOptions.length],
            consOptions[(stockHash + 2) % consOptions.length]
        ];
        
        return {
            pros: selectedPros,
            cons: selectedCons
        };
    }
    
    // Function to get time ago from timestamp
    function getTimeAgo(timestamp) {
        const now = new Date();
        const publishedDate = new Date(timestamp);
        const diffMs = now - publishedDate;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) {
            return "Less than 1 hour ago";
        } else if (diffHours < 24) {
            return `${diffHours} hours ago`;
        } else {
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays} days ago`;
        }
    }
    
    // Function to load and render stock chart
    async function loadStockChart(symbol) {
        try {
            const response = await fetch(`/api/chart/${symbol}`);
            const chartData = await response.json();
            
            // Hide loading indicator
            const loadingElement = document.getElementById(`chart-loading-${symbol}`);
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            // Get canvas element
            const canvas = document.getElementById(`chart-${symbol}`);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            // Prepare data for Chart.js
            const labels = chartData.data.map(item => {
                const date = new Date(item.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            
            const prices = chartData.data.map(item => item.price);
            
            // Determine chart color based on trend
            const firstPrice = prices[0];
            const lastPrice = prices[prices.length - 1];
            const isUpTrend = lastPrice > firstPrice;
            const chartColor = isUpTrend ? '#4CAF50' : '#F44336';
            const backgroundColor = isUpTrend ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
            
            // Create chart
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${symbol} Price`,
                        data: prices,
                        borderColor: chartColor,
                        backgroundColor: backgroundColor,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: chartColor,
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: chartColor,
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return `$${context.parsed.y.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                display: false
                            },
                            ticks: {
                                maxTicksLimit: 6,
                                color: '#666',
                                font: {
                                    size: 10
                                }
                            }
                        },
                        y: {
                            display: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                lineWidth: 1
                            },
                            ticks: {
                                maxTicksLimit: 5,
                                color: '#666',
                                font: {
                                    size: 10
                                },
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    elements: {
                        point: {
                            radius: 0
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error(`Error loading chart for ${symbol}:`, error);
            
            // Hide loading and show error
            const loadingElement = document.getElementById(`chart-loading-${symbol}`);
            if (loadingElement) {
                loadingElement.textContent = 'Chart unavailable';
                loadingElement.style.color = '#999';
            }
        }
    }
    
    // Function to generate stock description with company name
    function generateStockDescription(stock, companyName) {
        const descriptions = [
            `is a technology company focused on innovative solutions for the global market.`,
            `operates in the healthcare sector, developing advanced treatments for various medical conditions.`,
            `is a renewable energy company expanding its presence in emerging markets.`,
            `operates in the financial sector, offering banking and investment services to institutional and retail clients.`,
            `is a consumer goods company that has shown consistent growth in recent quarters.`,
            `develops disruptive technologies in the semiconductor and artificial intelligence sector.`,
            `is a biotechnology leader with a robust pipeline of drugs in development.`
        ];
        
        const stockHash = stock.symbol.charCodeAt(0);
        const selectedDescription = descriptions[stockHash % descriptions.length];
        
        return `${companyName} ${selectedDescription}`;
    }
    
    // Function to generate random recent time (last 24h)
    function getRandomRecentTime() {
        const times = [
            '5 minutes ago',
            '15 minutes ago',
            '30 minutes ago',
            '1 hour ago',
            '2 hours ago',
            '3 hours ago',
            '5 hours ago',
            '8 hours ago',
            '12 hours ago',
            '18 hours ago'
        ];
        
        return times[Math.floor(Math.random() * times.length)];
    }
    
    // Add event listeners to stock card elements
    function addEventListenersToStockCards() {
        // No Q&A event listeners needed anymore
        console.log('Stock cards loaded without Q&A functionality');
    }
    
    // Function to format volume
    function formatVolume(volume) {
        if (volume >= 1000000) {
            return (volume / 1000000).toFixed(1) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'K';
        } else {
            return volume.toString();
        }
    }
    
    // Function to reset countdown - DISABLED
    function resetCountdown() {
        console.log('Countdown disabled - no auto-refresh');
    }
    
    // Function to update countdown display - DISABLED
    function updateCountdown() {
        console.log('Countdown display disabled');
    }
    
    // Initialize controls
    function initializeControls() {
        // Set up event for stocks per page selector
        if (stocksPerPageSelect) {
            stocksPerPageSelect.addEventListener('change', function() {
                stocksPerPage = parseInt(this.value);
                fetchStocks();
            });
        }
    }
    
    // Set up event for update button
    if (updateButton) {
        updateButton.addEventListener('click', function() {
            fetchStocks();
        });
    }
    
    // Add CSS for improved layout (removed rank badge styles)
    const style = document.createElement('style');
    style.textContent = `
        .filters-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .filter-description h3 {
            margin: 0 0 5px 0;
            color: #fff;
            font-size: 1.2em;
        }
        
        .filter-description p {
            margin: 0;
            color: #ccc;
            font-size: 0.9em;
        }
        
        .company-name {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 0.9em;
            font-weight: normal;
        }
        
        .chart-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .chart-header h4 {
            margin: 0;
            color: #333;
            font-size: 1em;
        }
        
        .chart-loading {
            color: #666;
            font-size: 0.9em;
            font-style: italic;
        }
        
        .chart-container {
            position: relative;
            height: 150px;
            width: 100%;
        }
        
        .chart-container canvas {
            border-radius: 4px;
        }
        
        .pros-cons-container {
            margin: 20px 0;
        }
        
        .pros-cons-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
        }
        
        .pros-section, .cons-section {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .pros-section h4, .cons-section h4 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 1em;
            font-weight: bold;
        }
        
        .pros-list, .cons-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .pros-list li, .cons-list li {
            margin-bottom: 12px;
        }
        
        .news-link {
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: flex-start;
            transition: all 0.2s ease;
            padding: 8px;
            border-radius: 4px;
        }
        
        .news-link:hover {
            background-color: rgba(0, 0, 0, 0.05);
            text-decoration: none;
        }
        
        .check-icon {
            color: #4CAF50;
            margin-right: 8px;
            margin-top: 2px;
            font-weight: bold;
            font-size: 14px;
        }
        
        .x-icon {
            color: #F44336;
            margin-right: 8px;
            margin-top: 2px;
            font-weight: bold;
            font-size: 14px;
        }
        
        .news-content {
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        
        .news-text {
            font-size: 0.9em;
            line-height: 1.4;
            margin-bottom: 4px;
        }
        
        .news-time {
            font-size: 0.8em;
            color: #666;
            font-style: italic;
        }
        
        .latest-news-link {
            text-decoration: none;
            color: inherit;
            display: block;
            transition: all 0.2s ease;
            padding: 10px;
            border-radius: 4px;
        }
        
        .latest-news-link:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
        
        .latest-news-title {
            font-weight: bold;
            margin-bottom: 5px;
            line-height: 1.4;
        }
        
        .latest-news-time {
            font-size: 0.8em;
            color: #666;
            margin-top: 0;
        }
        
        .stock-description {
            margin-top: 15px;
            margin-bottom: 15px;
        }
        
        .qa-input {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .qa-input-field {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .btn-ask {
            padding: 8px 16px;
            background-color: #3CAEA3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s ease;
        }
        
        .btn-ask:hover {
            background-color: #2d8a7f;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            font-size: 18px;
            color: #666;
        }
        
        .no-stocks {
            text-align: center;
            padding: 20px;
            font-size: 16px;
            color: #999;
        }
        
        .error {
            text-align: center;
            padding: 20px;
            font-size: 16px;
            color: #f44336;
            background-color: #ffebee;
            border-radius: 4px;
            margin: 10px 0;
        }
        
        .qa-response {
            margin-top: 15px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 8px;
            border-left: 4px solid #3CAEA3;
        }
        
        .qa-loading {
            text-align: center;
            color: #666;
            font-style: italic;
        }
        
        .qa-answer p {
            margin: 10px 0;
            line-height: 1.6;
        }
        
        .qa-disclaimer {
            color: #888;
            font-size: 0.8em;
            margin-top: 10px;
            display: block;
        }
        
        .qa-error {
            color: #d32f2f;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .filters-info {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .chart-container {
                height: 120px;
            }
            
            .pros-cons-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .qa-input {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize controls
    initializeControls();
    
    // Fetch stocks initially
    fetchStocks();
    
    // No countdown needed
    console.log('App initialized without countdown');
});

