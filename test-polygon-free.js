// test-polygon-free.js
require('dotenv').config();
const axios = require('axios');

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

async function testPolygonFreeAPI() {
  try {
    console.log('Testando endpoints gratuitos da API do Polygon...');
    
    // Teste 1: Verificar status da API (endpoint gratuito)
    console.log('\nTeste 1: Status da API (gratuito)');
    const statusUrl = `https://api.polygon.io/v1/marketstatus/now?apiKey=${POLYGON_API_KEY}`;
    const statusRes = await axios.get(statusUrl);
    console.log('Status da API:', statusRes.data);
    
    // Teste 2: Buscar dados históricos de um ticker (endpoint gratuito)
    console.log('\nTeste 2: Dados históricos AAPL (gratuito)');
    const historicalUrl = `https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2023-01-09/2023-01-09?apiKey=${POLYGON_API_KEY}`;
    const historicalRes = await axios.get(historicalUrl);
    console.log('Dados históricos do AAPL:', historicalRes.data);
    
    // Teste 3: Buscar detalhes de um ticker (endpoint gratuito)
    console.log('\nTeste 3: Detalhes do ticker AAPL (gratuito)');
    const tickerDetailsUrl = `https://api.polygon.io/v3/reference/tickers/AAPL?apiKey=${POLYGON_API_KEY}`;
    const tickerDetailsRes = await axios.get(tickerDetailsUrl);
    console.log('Detalhes do AAPL:', tickerDetailsRes.data);
    
    // Teste 4: Tentar acessar snapshot (endpoint pago)
    console.log('\nTeste 4: Snapshot de tickers (provavelmente pago)');
    try {
      const snapshotUrl = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=${POLYGON_API_KEY}`;
      const snapshotRes = await axios.get(snapshotUrl);
      console.log(`Snapshot obtido. Total de tickers: ${snapshotRes.data.tickers?.length || 0}`);
      console.log('Você tem acesso ao endpoint de snapshot! Seu plano permite este acesso.');
    } catch (error) {
      console.error('Erro ao acessar snapshot (esperado no plano gratuito):');
      console.error('Status:', error.response?.status);
      console.error('Mensagem:', error.response?.data);
      console.log('Este erro é esperado no plano gratuito e confirma que você precisa de um plano pago para este endpoint.');
    }
    
    console.log('\n✅ Testes de endpoints gratuitos concluídos com sucesso!');
    console.log('\nCONCLUSÃO:');
    console.log('1. Se os testes 1-3 funcionaram mas o teste 4 falhou: Você tem um plano gratuito e precisa modificar o código para usar apenas endpoints gratuitos.');
    console.log('2. Se todos os testes funcionaram: Você tem um plano pago que permite acesso ao endpoint de snapshot.');
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error('Mensagem:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

testPolygonFreeAPI();
