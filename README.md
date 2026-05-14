# DashLoto

Web App para verificação de resultados do Euromilhões e Totoloto da Santa Casa.


## 📁 Estrutura do Projeto

```
DashLoto/
├── index.html          # Frontend (Tailwind CSS)
├── styles.css          # Estilos complementares
├── app.js              # Lógica JavaScript
├── api/
│   ├── euromilhoes.js  # Serverless function - scraping Euromilhões
│   └── totoloto.js     # Serverless function - scraping Totoloto
├── package.json        # Dependências (axios, cheerio)
├── vercel.json         # Configuração Vercel
└── README.md
```

## 🔍 Como funciona

1. O **frontend** (index.html) chama `/api/euromilhoes` ou `/api/totoloto`
2. As **serverless functions** fazem scraping do site da Santa Casa
3. Os dados são retornados ao frontend para comparação com a chave do utilizador

## ⚠️ Notas

- O scraping pode falhar se a Santa Casa alterar a estrutura do site
- Dados de fallback são usados em caso de erro
- Esta aplicação é apenas para fins informativos
