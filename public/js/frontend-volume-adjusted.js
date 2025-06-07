// frontend-volume-adjusted.js - Versão com sincronização de filtros melhorada
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da UI
    const stocksContainer = document.getElementById('stocks-container');
    const updateButton = document.getElementById('update-button');
    const countdownElement = document.getElementById('countdown');
    
    // Elementos de filtro
    const priceRangeSlider = document.getElementById('price-range');
    const volumeRangeSlider = document.getElementById('volume-range');
    const stocksPerPageSelect = document.getElementById('stocks-per-page');
    
    // Valores padrão dos filtros
    let minPrice = 2;
    let maxPrice = 10;
    let minVolume = 1000000; // 1M como valor mínimo padrão
    let maxVolume = 50000000; // 50M como valor máximo padrão
    let stocksPerPage = 3;
    
    // Inicializar contagem regressiva
    let countdown = 30;
    let countdownInterval;
    
    // Função para buscar dados de stocks
    function fetchStocks() {
        // Construir URL com parâmetros de filtro
        const url = `/api/stocks?minPrice=${minPrice}&maxPrice=${maxPrice}&minVolume=${minVolume}&limit=${stocksPerPage}`;
        
        // Mostrar indicador de carregamento
        stocksContainer.innerHTML = '<div class="loading">Carregando stocks...</div>';
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na API: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Limpar container
                stocksContainer.innerHTML = '';
                
                // Verificar se há dados
                if (!data || data.length === 0) {
                    stocksContainer.innerHTML = '<div class="no-stocks">Nenhum stock encontrado com os filtros atuais.</div>';
                    return;
                }
                
                // Renderizar cada stock
                data.forEach(stock => {
                    renderStock(stock);
                });
                
                // Reiniciar contagem regressiva
                resetCountdown();
            })
            .catch(error => {
                console.error('Erro ao buscar stocks:', error);
                stocksContainer.innerHTML = `<div class="error">Erro ao carregar stocks: ${error.message}</div>`;
            });
    }
    
    // Função para renderizar um stock
    function renderStock(stock) {
        // Determinar se é bullish ou bearish
        const sentiment = stock.sentiment.toLowerCase().includes('positivo') ? 'BULLISH' : 'BEARISH';
        const sentimentClass = sentiment === 'BULLISH' ? 'bullish' : 'bearish';
        
        // Formatar volume
        const formattedVolume = formatVolume(stock.volume);
        
        // Calcular variação de preço (simulada para este exemplo)
        const priceChange = (Math.random() * 5 - 2.5).toFixed(2);
        const percentChange = (priceChange / stock.price * 100).toFixed(1);
        const changeClass = priceChange >= 0 ? 'positive' : 'negative';
        const changePrefix = priceChange >= 0 ? '+' : '';
        
        // Criar elemento de stock
        const stockElement = document.createElement('div');
        stockElement.className = 'stock-card';
        
        // HTML para o card do stock
        stockElement.innerHTML = `
            <div class="stock-header">
                <h2 class="stock-symbol">${stock.symbol}</h2>
                <div class="stock-sentiment ${sentimentClass}">${sentiment}</div>
            </div>
            <div class="stock-price">$${stock.price.toFixed(2)}</div>
            <div class="stock-change ${changeClass}">${changePrefix}${priceChange} (${changePrefix}${percentChange}%)</div>
            
            <div class="stock-metrics">
                <div class="metric">
                    <span class="metric-label">Volume</span>
                    <span class="metric-value">${formattedVolume}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Rel Volume</span>
                    <span class="metric-value">${(Math.random() * 3 + 0.5).toFixed(1)}</span>
                </div>
            </div>
            
            <div class="stock-section">
                <h3>Why it's trending</h3>
                <p>${stock.news[0]?.summary || 'Informação não disponível.'}</p>
            </div>
            
            <div class="stock-section">
                <div class="pros-cons">
                    <div class="pros">
                        <h4>PROS</h4>
                        <ul>
                            <li>Forte interesse institucional</li>
                            <li>Crescimento de receita</li>
                        </ul>
                    </div>
                    <div class="cons">
                        <h4>CONS</h4>
                        <ul>
                            <li>Competição crescente</li>
                            <li>Margens em queda</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="stock-qa">
                <h3>Ask about this stock</h3>
                <div class="qa-input">
                    <input type="text" placeholder="Ask a question..." class="question-input">
                    <button class="ask-button">Ask</button>
                </div>
                <div class="qa-suggestions">
                    <span class="qa-tag">What does this volume indicate?</span>
                    <span class="qa-tag">Is this better for day or swing trading?</span>
                    <span class="qa-tag">What are the key risks?</span>
                </div>
            </div>
        `;
        
        // Adicionar ao container
        stocksContainer.appendChild(stockElement);
    }
    
    // Função para formatar volume
    function formatVolume(volume) {
        if (volume >= 1000000) {
            return (volume / 1000000).toFixed(1) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'K';
        } else {
            return volume.toString();
        }
    }
    
    // Função para reiniciar contagem regressiva
    function resetCountdown() {
        // Limpar intervalo existente
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        // Reiniciar contagem
        countdown = 30;
        updateCountdown();
        
        // Iniciar novo intervalo
        countdownInterval = setInterval(() => {
            countdown--;
            updateCountdown();
            
            if (countdown <= 0) {
                fetchStocks();
            }
        }, 1000);
    }
    
    // Função para atualizar exibição da contagem regressiva
    function updateCountdown() {
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
    }
    
    // Inicializar filtros
    function initializeFilters() {
        // Configurar eventos para os filtros
        if (priceRangeSlider) {
            priceRangeSlider.addEventListener('input', function() {
                // Atualizar valores de preço min/max
                // Nota: Este é um exemplo simplificado. Você precisaria ajustar com base na sua UI real
                const value = parseFloat(priceRangeSlider.value);
                minPrice = 2;
                maxPrice = 10;
                
                // Atualizar exibição do valor
                const priceDisplay = document.getElementById('price-display');
                if (priceDisplay) {
                    priceDisplay.textContent = `$${minPrice} - $${maxPrice}`;
                }
            });
        }
        
        if (volumeRangeSlider) {
            volumeRangeSlider.addEventListener('input', function() {
                // Atualizar valores de volume min/max
                // Nota: Este é um exemplo simplificado. Você precisaria ajustar com base na sua UI real
                const value = parseFloat(volumeRangeSlider.value);
                minVolume = 1000000; // Mínimo fixo em 1M
                maxVolume = 50000000;
                
                // Atualizar exibição do valor
                const volumeDisplay = document.getElementById('volume-display');
                if (volumeDisplay) {
                    volumeDisplay.textContent = `${formatVolume(minVolume)} - ${formatVolume(maxVolume)}`;
                }
            });
        }
        
        if (stocksPerPageSelect) {
            stocksPerPageSelect.addEventListener('change', function() {
                stocksPerPage = parseInt(stocksPerPageSelect.value);
                fetchStocks();
            });
        }
    }
    
    // Configurar evento para botão de atualização
    if (updateButton) {
        updateButton.addEventListener('click', fetchStocks);
    }
    
    // Inicializar filtros
    initializeFilters();
    
    // Buscar stocks inicialmente
    fetchStocks();
});
