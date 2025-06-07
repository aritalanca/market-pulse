# Stock Beacon

Real-time stock market analysis with ChatGPT integration.

## 🚀 Features

- **Real-time Stock Data**: Live market data from Polygon API
- **Volume-based Ordering**: Stocks always ordered by highest volume
- **Price & Volume Filters**: Fixed filters ($2-30, volume >1M)
- **Interactive Charts**: 30-day price trend visualization
- **News Integration**: Recent news for each stock
- **ChatGPT Assistant**: Integrated AI chat for market questions
- **Responsive Design**: Works on desktop and mobile

## 📊 Stock Information

Each stock card displays:
- Current price and percentage change
- Trading volume (formatted)
- 30-day price chart
- Recent news with timestamps
- Pros/Cons analysis
- Company information

## 🤖 ChatGPT Integration

- Click the chat button in the bottom-right corner
- Ask questions about stocks, trading, or market analysis
- Get intelligent responses powered by OpenAI

## 🔧 Technical Stack

- **Backend**: Node.js + Express
- **APIs**: Polygon.io, OpenAI
- **Frontend**: Vanilla JavaScript, CSS3
- **Charts**: Chart.js
- **Deployment**: Render.com

## 🌐 Live Demo

Visit the live application at: [Your Render URL]

## 📈 API Endpoints

- `GET /api/stocks?limit=N` - Get top N stocks by volume
- `POST /api/chat` - ChatGPT integration
- `GET /api/chart/:symbol` - Historical price data
- `GET /health` - Health check

## 🔑 Environment Variables

Required for deployment:
- `POLYGON_API_KEY` - Polygon.io API key
- `OPENAI_API_KEY` - OpenAI API key (optional)

## 📱 Usage

1. **View Stocks**: See top stocks ordered by volume
2. **Change Quantity**: Select 3, 5, 10, 20, 50, or 100 stocks per page
3. **Read News**: Click on news items for full articles
4. **Ask Questions**: Use the ChatGPT assistant for market insights

## 🎯 Consistent Ordering

The application maintains consistent ordering by volume:
- 3 stocks: Shows top 3 by volume
- 10 stocks: Shows same top 3 + next 7 by volume
- 100 stocks: Shows same top 10 + next 90 by volume

Order never changes - stock #1 is always the highest volume stock.

---

Built for real-time market analysis and educational purposes.

