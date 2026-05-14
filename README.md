# DashLoto

Web App para verificação de resultados do Euromilhões e Totoloto da Santa Casa.

## 🚀 Deploy para Vercel

### Opção 1: GitHub (Recomendado)
1. Faz push do código para um repositório GitHub
2. Vai a [vercel.com](https://vercel.com) e faz "Import Project"
3. Seleciona o repositório
4. Clica em "Deploy"

### Opção 2: Vercel CLI
```bash
npm i -g vercel
vercel
```

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