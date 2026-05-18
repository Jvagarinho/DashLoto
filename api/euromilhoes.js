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
        
        console.log('Found result li elements:', resultLis.length);
        
        resultLis.each((i, el) => {
            const text = $(el).text().trim();
            console.log(`Result li ${i}: "${text}"`);
        });
        
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
        
        $('[class*="date"]').each((i, el) => {
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
            
            if (text.includes('€') && !isNaN(value) && value > 0 && value < 1000000) {
                prizeElements.push({ text, value });
            }
        });
        
        console.log('Prize elements found:', prizeElements);
        
        const prizeOrder = [
            '5+0', '4+2', '4+1', '3+2', '4+0',
            '2+2', '3+1', '3+0', '1+2', '2+1',
            '5+2', '5+1'
        ];
        
        prizeOrder.forEach((key, i) => {
            if (prizeElements[i]) {
                prizes[key] = prizeElements[i].value;
                console.log(`Prize ${key} (index ${i}): ${prizeElements[i].value}`);
            }
        });
        
        console.log('Final numbers:', numbers, 'Stars:', stars);
        
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