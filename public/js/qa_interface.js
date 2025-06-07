/**
 * Q&A Interface Module for interactive stock analysis
 * Handles user questions and provides AI-powered answers about stocks
 */

window.QAInterface = (function() {
    // Initialize Q&A interface
    function initialize() {
        console.log('Q&A Interface module initialized');
        
        // Set up event listeners for Q&A interface
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Submit buttons
        document.querySelectorAll('.qa-submit').forEach(button => {
            button.addEventListener('click', handleQuestionSubmit);
        });
        
        // Suggestion clicks
        document.querySelectorAll('.qa-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', handleSuggestionClick);
        });
        
        // Enter key in input
        document.querySelectorAll('.qa-input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleQuestionSubmit.call(this);
                }
            });
        });
    }
    
    // Handle question submission
    function handleQuestionSubmit() {
        const card = this.closest('.stock-card');
        const input = card.querySelector('.qa-input');
        const question = input.value.trim();
        
        if (!question) return;
        
        const symbol = card.dataset.symbol;
        
        // Show loading state
        const answerElement = card.querySelector('.qa-answer');
        answerElement.textContent = 'Analyzing your question...';
        answerElement.classList.add('loading');
        answerElement.style.display = 'block';
        
        // In a real implementation, this would call the API
        // For demo purposes, we'll simulate a response
        setTimeout(() => {
            const answer = generateDemoAnswer(question, symbol);
            displayAnswer(card, question, answer);
            input.value = '';
        }, 1500);
    }
    
    // Handle suggestion click
    function handleSuggestionClick() {
        const card = this.closest('.stock-card');
        const input = card.querySelector('.qa-input');
        input.value = this.textContent;
        
        // Trigger submit
        card.querySelector('.qa-submit').click();
    }
    
    // Display answer in the UI
    function displayAnswer(card, question, answer) {
        const answerElement = card.querySelector('.qa-answer');
        answerElement.textContent = answer;
        answerElement.classList.remove('loading');
        
        // Add to history
        const historyElement = card.querySelector('.qa-history');
        const historyItem = document.createElement('div');
        historyItem.classList.add('qa-history-item');
        
        const questionElement = document.createElement('div');
        questionElement.classList.add('qa-history-question');
        questionElement.textContent = 'Q: ' + question;
        
        const answerHistoryElement = document.createElement('div');
        answerHistoryElement.classList.add('qa-history-answer');
        answerHistoryElement.textContent = 'A: ' + answer;
        
        historyItem.appendChild(questionElement);
        historyItem.appendChild(answerHistoryElement);
        
        historyElement.prepend(historyItem);
    }
    
    // Generate demo answers based on question and symbol
    function generateDemoAnswer(question, symbol) {
        const lowerQuestion = question.toLowerCase();
        
        // Volume related questions
        if (lowerQuestion.includes('volume')) {
            if (symbol === 'FOMO') {
                return "The high volume (3.2M) indicates strong interest in the quantum computing announcement. With a relative volume of 4.8x compared to average, this suggests institutional buying and retail FOMO. Watch for sustained volume to confirm trend strength.";
            } else if (symbol === 'BULL') {
                return "The current volume of 2.8M with 2.3x relative volume shows moderate institutional interest following the government contract announcement. This is healthy accumulation but not yet at FOMO levels.";
            } else if (symbol === 'FEAR') {
                return "The 4.1M volume with 5.2x relative volume indicates panic selling following the failed trial announcement. This extreme volume spike often marks capitulation, which could present a reversal opportunity for experienced traders.";
            }
        }
        
        // Day or swing trading questions
        if (lowerQuestion.includes('day') || lowerQuestion.includes('swing')) {
            if (symbol === 'FOMO') {
                return "FOMO is better suited for day trading due to its high volatility and current hype cycle. The quantum computing catalyst will likely create intraday opportunities, but be cautious of potential dilution risks for longer holds.";
            } else if (symbol === 'BULL') {
                return "BULL has characteristics favorable for both approaches. For day trading, watch for morning momentum. For swing trading, the government contract provides a multi-week catalyst with less overnight risk than typical momentum plays.";
            } else if (symbol === 'FEAR') {
                return "FEAR is currently a high-risk day trade only. The failed trial creates too much uncertainty for swing positions. Day traders may find opportunities in the volatility, but only with strict risk management.";
            }
        }
        
        // Support levels
        if (lowerQuestion.includes('support') || lowerQuestion.includes('resistance')) {
            if (symbol === 'FOMO') {
                return "Key support levels for FOMO are at $3.85 (previous resistance) and $3.42 (20-day EMA). Resistance is at $4.50 (psychological) and $4.78 (recent high). Watch the $3.85 level closely as it may determine if the uptrend continues.";
            } else if (symbol === 'BULL') {
                return "BULL has support at $6.90 (previous consolidation high) and $6.55 (50-day MA). Resistance is at $7.75 (recent high) and $8.25 (6-month high). The clean break above $7.00 suggests momentum may continue.";
            } else if (symbol === 'FEAR') {
                return "After the drop, FEAR has support at $4.75 (previous low) and $4.25 (major support from Q1). Resistance now at $5.50 (gap fill level) and $6.25 (200-day MA). The stock needs to hold $4.75 to avoid further downside.";
            }
        }
        
        // Generic response
        return "Based on the latest data for " + symbol + ", this question requires deeper analysis. In a real implementation, this would connect to our API for real-time insights based on market conditions, technical analysis, and fundamental data.";
    }
    
    // Public API
    return {
        initialize: initialize
    };
})();
