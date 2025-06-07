# Stock Beacon - Render Deployment

## 🚀 Deploy to Render

### Prerequisites
- Conta no [Render](https://render.com)
- Repositório Git (GitHub, GitLab, ou Bitbucket)

### Passo 1: Preparar o Repositório

1. **Criar repositório Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Stock Beacon"
   ```

2. **Push para GitHub/GitLab:**
   - Criar repositório no GitHub
   - Fazer push do código

### Passo 2: Configurar no Render

1. **Aceder ao Render Dashboard:**
   - Ir para [render.com](https://render.com)
   - Fazer login/criar conta

2. **Criar novo Web Service:**
   - Clicar em "New +"
   - Selecionar "Web Service"
   - Conectar o repositório Git

3. **Configurações do Deploy:**
   ```
   Name: stock-beacon
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

### Passo 3: Variáveis de Ambiente

Adicionar as seguintes variáveis no Render:

```
POLYGON_API_KEY=KrRfcFirynZz7PkKNOJOJOJOJOJOJOJO
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWELVE_API_KEY=your_twelve_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
NEWSAPI_KEY=your_newsapi_key
NODE_ENV=production
```

### Passo 4: Deploy

1. **Deploy automático:**
   - Render fará deploy automaticamente
   - Aguardar conclusão (5-10 minutos)

2. **URL gerado:**
   - Render fornecerá URL como: `https://stock-beacon-xxxx.onrender.com`

### Passo 5: Verificar

- Aceder ao URL fornecido
- Testar endpoint: `https://your-url.onrender.com/health`
- Verificar stocks: `https://your-url.onrender.com/api/stocks?limit=3`

## 🔧 Configurações Importantes

### Auto-Deploy
- Render faz redeploy automático a cada push para o branch principal
- Ideal para atualizações contínuas

### Domínio Personalizado (Opcional)
- Pode configurar domínio próprio nas configurações do Render
- Certificado SSL automático

### Monitorização
- Render fornece logs em tempo real
- Métricas de performance disponíveis

## 📊 Endpoints Disponíveis

- `GET /` - Interface principal
- `GET /health` - Health check
- `GET /api/stocks?limit=N` - Lista de stocks
- `POST /api/chat` - ChatGPT integration
- `GET /api/chart/:symbol` - Dados de gráficos

## 🚨 Notas Importantes

1. **Plano Gratuito:**
   - Render oferece plano gratuito
   - Pode ter "sleep" após inatividade
   - Para uso 24/7, considerar plano pago

2. **Performance:**
   - Primeira requisição pode ser lenta (cold start)
   - Subsequentes são rápidas

3. **Logs:**
   - Acessíveis no dashboard do Render
   - Úteis para debugging

