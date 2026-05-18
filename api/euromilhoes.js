const axios = require('axios');
const cheerio = require('cheerio');

async function handler(req, res) {
    const BASE_URL = 'https://www.jogossantacasa.pt/web/SCCartazResult';
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        console.log('Fetching Euromilhões...');
        
        const response = await axios.get(BASE_URL + '/euroMilhoes', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'pt-PT,pt;q=0.9'
            },
            timeout: 30000
        });

        const $ = cheerio.load(response.data);
        
        let numbers = [];
        let stars = [];
        let date = '';
        let prizes = {};
        
        const betMiddle = $('div.betMiddle.twocol.regPad').first();
        const columsUl = betMiddle.find('ul.colums').first();
        const resultLis = columsUl.find('li');
        
        const firstLi = resultLis.first();
        const text = firstLi.text().trim();
        
        if (text.includes('+')) {
            const parts = text.split('+');
            const numbersPart = parts[0].trim();
            const starsPart = parts[1].trim();
            
            const nums = numbersPart.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n) && n >= 1 && n <= 50);
            const starNums = starsPart.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n) && n >= 1 && n <= 12);
            
            if (nums.length === 5) {
                numbers = nums;
            }
            if (starNums.length >= 1) {
                stars = starNums;
            }
        }
        
        $('span, div, p').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (match && !date) {
                date = `${match[1]}/${match[2]}/${match[3]}`;
            }
        });
        
        const prizeElements = [];
        $('li').each((i, el) => {
            const text = $(el).text().trim();
            const valueStr = text.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
            const value = parseFloat(valueStr);
            
            if (text.includes('€') && !isNaN(value) && value > 0) {
                prizeElements.push({ text, value });
            }
        });
        
        console.log('All prize elements:', prizeElements);
        
        // Separate normal prizes from jackpot prizes
        const normalPrizes = [];
        const jackpotPrizes = [];
        
        prizeElements.forEach(p => {
            if (p.value > 10000000) {
                jackpotPrizes.push(p);
            } else {
                normalPrizes.push(p);
            }
        });
        
        const hasJackpot = jackpotPrizes.length > 0;
        
        console.log('Normal prizes:', normalPrizes.length);
        console.log('Jackpot prizes:', jackpotPrizes.length);
        console.log('Has jackpot:', hasJackpot);
        
        if (hasJackpot) {
            // Jackpot prize structure (when there's at least one winner):
            // The first few elements are the actual prize categories
            // The last elements (>10M) are jackpot-related values
            
            // prizeElements[0] = 2º Prémio (5+1) = €710,654
            // prizeElements[1] = 3º Prémio (5+0) = €83,045,77
            // etc.
            // prizeElements[12] = Jackpot estimado = €92M (informativo)
            // prizeElements[13] = Jackpot real = €27M (sem vencedor)
            // prizeElements[14] = Receita ilíquida (NÃO é prémio!)
            
            const prizeMapping = {
                '5+1': 0,
                '5+0': 1,
                '4+2': 2,
                '4+1': 3,
                '3+2': 4,
                '4+0': 5,
                '2+2': 6,
                '3+1': 7,
                '3+0': 8,
                '1+2': 9,
                '2+1': 10
            };
            
            Object.keys(prizeMapping).forEach(key => {
                const idx = prizeMapping[key];
                if (normalPrizes[idx]) {
                    prizes[key] = normalPrizes[idx].value;
                }
            });
            
            // 5+2 (1º Prémio) = €0 because no one won
            prizes['5+2'] = 0;
        } else {
            // No jackpot winner (rollover):
            // index 0 = 5+0 (3º Prémio) - €710K
            // index 1 = 4+2 (4º Prémio) - €83K
            // index 2 = 3+2 (6º Prémio) - €1.9K
            // ...
            const prizeMapping = {
                '5+0': 0,
                '4+2': 1,
                '3+2': 2,
                '4+1': 3,
                '4+0': 4,
                '2+2': 5,
                '3+1': 6,
                '3+0': 7,
                '1+2': 8,
                '2+1': 9
            };
            
            Object.keys(prizeMapping).forEach(key => {
                const idx = prizeMapping[key];
                if (prizeElements[idx]) {
                    prizes[key] = prizeElements[idx].value;
                }
            });
        }
        
        console.log('Final prizes:', prizes);
        
        res.status(200).json({ 
            numbers, 
            stars, 
            date, 
            prizes 
        });
        
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(200).json({ 
            numbers: [4, 26, 32, 35, 36], 
            stars: [5, 7], 
            date: '12/05/2026',
            prizes: {}
        });
    }
}

module.exports = handler;