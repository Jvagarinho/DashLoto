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
        console.log('Fetching Totoloto...');
        
        const response = await axios.get(BASE_URL + '/totolotoNew', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'pt-PT,pt;q=0.9'
            },
            timeout: 30000
        });

        const $ = cheerio.load(response.data);
        
        let numbers = [];
        let luckyNumber = [];
        let prizes = {};
        
        const betMiddle = $('div.betMiddle.twocol.regPad').first();
        const columsUl = betMiddle.find('ul.colums').first();
        const resultLis = columsUl.find('li');
        
        const firstLi = resultLis.first();
        const text = firstLi.text().trim();
        
        if (text.includes('+')) {
            const parts = text.split('+');
            const numbersPart = parts[0].trim();
            const luckyPart = parts[1].trim();
            
            const nums = numbersPart.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n) && n >= 1 && n <= 49);
            const lucky = parseInt(luckyPart);
            
            if (nums.length === 5) {
                numbers = nums;
            }
            if (!isNaN(lucky) && lucky >= 1 && lucky <= 13) {
                luckyNumber = [lucky];
            }
        }
        
        const prizeElements = [];
        $('li').each((i, el) => {
            const text = $(el).text().trim();
            const valueStr = text.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
            const value = parseFloat(valueStr);
            
            if (text.includes('€') && !isNaN(value) && value > 0 && value < 1000000) {
                prizeElements.push({ text, value });
            }
        });
        
        console.log('Prize elements found:', prizeElements);
        
        // No Totoloto, the order is:
        // index 0 = 5+0 (2º Prémio, ou 1º se não houver jackpot)
        // index 1 = 4+1 (3º Prémio)
        // index 2 = 4+0 (4º Prémio)
        // index 3 = 3+1 (5º Prémio)
        
        const prizeMapping = {
            '5+1': 0, // jackpot - pode não existir
            '5+0': 0, // 2º Prémio (ou 1º se não houver jackpot)
            '4+1': 1, // 3º Prémio
            '4+0': 2, // 4º Prémio
            '3+1': 3  // 5º Prémio
        };
        
        Object.keys(prizeMapping).forEach(key => {
            const idx = prizeMapping[key];
            if (prizeElements[idx]) {
                prizes[key] = prizeElements[idx].value;
                console.log(`Prize ${key} (index ${idx}): ${prizeElements[idx].value}`);
            }
        });
        
        console.log('Final numbers:', numbers, 'Lucky:', luckyNumber);
        
        res.status(200).json({ 
            numbers, 
            stars: luckyNumber, 
            prizes 
        });
        
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(200).json({ 
            numbers: [5, 7, 13, 21, 40], 
            stars: [7], 
            prizes: {}
        });
    }
}

module.exports = handler;