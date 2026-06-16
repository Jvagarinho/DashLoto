<p align="center">
  <a href="https://github.com/Jvagarinho/DashLoto">
    <img src="https://img.shields.io/badge/DashLoto-🎰-0ea5e9?style=for-the-badge&logoWidth=20" alt="DashLoto">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status">
  <img src="https://img.shields.io/github/last-commit/Jvagarinho/DashLoto?style=flat-square" alt="Last Commit">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/deploy-vercel-black?style=flat-square&logo=vercel" alt="Vercel">
  <img src="https://img.shields.io/badge/stack-vanilla%20js-yellow?style=flat-square&logo=javascript" alt="JavaScript">
  <img src="https://img.shields.io/badge/tailwindcss-0ea5e9?style=flat-square&logo=tailwindcss" alt="Tailwind CSS">
</p>

<h1 align="center">DashLoto</h1>

<p align="center">
  <strong>Verificador de Resultados — Euromilhões & Totoloto</strong><br>
  Resultados oficiais em tempo real com valores de prémios extraídos do site da Santa Casa.
</p>

---

## ✨ Funcionalidades

| | |
|---|---|
| **🎯 Verificação Individual** | Insere a tua chave e descobre o prémio instantaneamente. Suporte para Euromilhões e Totoloto com acertos destacados visualmente. |
| **⭐ Múltiplos Favoritos** | Guarda até **5 chaves** (Euromilhões) ou **10 chaves** (Totoloto). Carrega e verifica rapidamente. |
| **✅ Verificar Todas** | Verifica todas as chaves guardadas de uma só vez. Resultados lado a lado com prémios individuais. |
| **💾 Persistência em Ficheiro** | As chaves são guardadas num ficheiro `.json` no teu computador via **File System Access API**. Persistem mesmo se limpares o histórico do navegador. |
| **🔍 Detecção de Duplicados** | Alerta automático se tentares guardar uma chave já existente, com opção de confirmar ou cancelar. |
| **💰 Prémios Reais** | Valores extraídos do site oficial sorteio a sorteio. Sem estimativas — o valor exato do prémio. Jackpot detetado automaticamente. |
| **🔄 Reembolso Totoloto** | Acertar apenas no **Nº da Sorte** devolve **€2** (equivalente ao valor da aposta). |
| **🛡️ Fallback Inteligente** | Dados de exemplo quando o site está indisponível. A app nunca fica sem resposta. |
| **📤 Exportar / 📥 Importar** | Exporta as tuas chaves para ficheiro JSON e importa noutro dispositivo/navegador. |

---

## 🎮 Jogos Suportados

| Jogo | Números | Estrelas / Nº Sorte | Máx. Chaves |
|:-----|:-------:|:-------------------:|:-----------:|
| **Euromilhões** | 5 (1–50) | 2 (1–12) | 5 |
| **Totoloto** | 5 (1–49) | 1 (1–13) | 10 |

---

## 🏆 Tabela de Prémios

### Euromilhões

| Prémio | Acerto |
|:-------|:-------|
| 🥇 **1.º Prémio (Jackpot)** | 5 Números + 2 Estrelas |
| 🥈 2.º Prémio | 5 Números + 1 Estrela |
| 🥉 3.º Prémio | 5 Números |
| 4.º Prémio | 4 Números + 2 Estrelas |
| 5.º Prémio | 4 Números + 1 Estrela |
| 6.º Prémio | 3 Números + 2 Estrelas |
| 7.º Prémio | 4 Números |
| 8.º Prémio | 2 Números + 2 Estrelas |
| 9.º Prémio | 3 Números + 1 Estrela |
| 10.º Prémio | 3 Números |
| 11.º Prémio | 1 Número + 2 Estrelas |
| 12.º Prémio | 2 Números + 1 Estrela |
| 13.º Prémio | 2 Números |

### Totoloto

| Prémio | Acerto |
|:-------|:-------|
| 🥇 **1.º Prémio (Jackpot)** | 5 Números + Nº da Sorte |
| 🥈 2.º Prémio | 5 Números |
| 🥉 3.º Prémio | 4 Números |
| 4.º Prémio | 3 Números |
| 5.º Prémio | 2 Números |
| 💸 **Reembolso** | Nº da Sorte (€2) |



---

## 📁 Estrutura do Projeto

```
DashLoto/
├── 📄 index.html           # Frontend — interface principal
├── 🎨 styles.css            # Estilos complementares ao Tailwind
├── ⚡ app.js                # Lógica JavaScript da aplicação
│
├── 📂 api/
│   ├── 🇪🇺 euromilhoes.js   # Serverless: scraping Euromilhões
│   └── 🇵🇹 totoloto.js      # Serverless: scraping Totoloto
│
├── 📦 package.json          # Dependências (axios, cheerio)
├── ⚙️ vercel.json           # Configuração de deploy Vercel
└── 📖 README.md             # Documentação
```

---

## 🚀 Desenvolvimento Local

### Pré-requisitos

- **Node.js** 18+
- **Vercel CLI** — `npm i -g vercel`

### Setup

```bash
# Clonar
git clone https://github.com/Jvagarinho/DashLoto.git
cd DashLoto

# Instalar dependências
npm install

# Iniciar servidor local (http://localhost:3000)
vercel dev
```

---

## 🌐 Deploy na Vercel

```bash
vercel --prod
```

O deploy é automático se tiveres o repositório ligado à Vercel.

---

## ⚙️ API — Formato de Resposta

### `GET /api/euromilhoes`
### `GET /api/totoloto`

```json
{
  "numbers": [6, 16, 19, 34, 41],
  "stars": [4],
  "date": "20/05/2026",
  "prizes": {
    "5+0": 25270.12,
    "4+0": 407.49,
    "3+0": 5.15,
    "2+0": 2.16,
    "0+1": 2
  }
}
```

---

## 💾 Persistência de Dados

A aplicação utiliza uma **estratégia híbrida** para garantir que as tuas chaves nunca se perdem:

| Camada | Descrição | Persistência |
|:------|:----------|:-------------|
| **Ficheiro JSON** (primária) | Guardado via File System Access API no computador do utilizador | ✅ Permanente (sobrevive a limpeza de histórico) |
| **localStorage** (cache) | Cópia rápida para acesso imediato | ⚠️ Limitada (apagada se limpar dados do site) |
| **Exportar/Importar** | Backup manual em ficheiro `.json` portátil | ✅ Total controlo do utilizador |

> **Nota:** A File System Access API requer permissão do utilizador na primeira gravação. O botão **"📁 Guardar em..."** permite escolher/alterar a localização do ficheiro a qualquer momento.

---

## ⚠️ Notas Importantes

- O scraping pode falhar se a Santa Casa alterar a estrutura do HTML — os parsers usam seletores específicos (`ul.colums`, `div.betMiddle`)
- As chaves favoritas são guardadas **localmente no teu dispositivo** — não são partilhadas entre dispositivos nem enviadas para servidores
- Esta aplicação é apenas para **fins informativos**. Verifica sempre os resultados oficiais em [jogossantacasa.pt](https://www.jogossantacasa.pt)
- **Sem autenticação, sem contas, sem tracking** — 100% privacidade

---

## 📄 Licença

Distribuído sob a licença MIT. Consulta `LICENSE` para mais informações.

---

<p align="center">
  Feito com ❤️ em Portugal<br>
  <sub>DashLoto © 2026 • <a href="https://github.com/Jvagarinho/DashLoto">GitHub</a></sub>
</p>
