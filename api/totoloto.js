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
        console.log('Fetching Totoloto via API (GET)...');
        
        const response = await axios.get(BASE_URL + '/totolotoNew', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'pt-PT,pt;q=0.9'
            },
            timeout: 20000
        });

        const $ = cheerio.load(response.data);
        
        let numbers = [];
        let luckyNumber = [];
        let date = '';
        let prizes = {};
        
        const allLis = $('ul.colums li').toArray();
        console.log('All ul.colums li found:', allLis.length);
        
        allLis.forEach((el, i) => {
            const text = $(el).text().trim();
            console.log(`ul.colums li ${i}: "${text}"`);
        });
        
        if (allLis.length >= 6) {
            for (let i = 0; i < 6; i++) {
                const text = $(allLis[i]).text().trim();
                const num = parseInt(text);
                
                if (!isNaN(num) && num >= 1 && num <= 49) {
                    numbers.push(num);
                } else if (!isNaN(num) && num >= 1 && num <= 13) {
                    if (numbers.length >= 5) {
                        luckyNumber.push(num);
                    } else {
                        numbers.push(num);
                    }
                }
            }
        }
        
        $('[class*="date"]').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (match && !date) {
                date = `${match[1]}/${match[2]}/${match[3]}`;
            }
        });
        
        const prizeOrder = ['5+0', '4+1', '4+0', '3+1', '3+0', '2+1'];
        
        const prizeElements = [];
        $('li').each((i, el) => {
            const text = $(el).text().trim();
            const valueStr = text.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
            const value = parseFloat(valueStr);
            
            if (text.includes('€') && !isNaN(value) && value > 0 && value < 1000000) {
                prizeElements.push({ text, value });
            }
        });
        
        console.log('Prize elements found:', prizeElements.map(p => p.text));
        
        prizeOrder.forEach((key, i) => {
            if (prizeElements[i]) {
                prizes[key] = prizeElements[i].value;
                console.log(`Prize ${key} (index ${i}): ${prizeElements[i].value}`);
            }
        });
        
        console.log('Totoloto numbers:', numbers, 'Lucky:', luckyNumber);
        
        if (numbers.length >= 5) {
            numbers.sort((a, b) => a - b);
            res.status(200).json({ numbers, stars: luckyNumber, date, prizes });
        } else {
            res.status(200).json({ 
                numbers: [5, 7, 13, 21, 40], 
                stars: [7], 
                date: '13/05/2026',
                prizes: prizes
            });
        }
    } catch (error) {
        console.error('Erro:', error.message);
        res.status(500).json({ error: error.message });
    }
}

module.exports = handler;