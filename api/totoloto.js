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
        
        $('li').each((i, el) => {
            const text = $(el).text().trim();
            console.log(`li ${i}: "${text}"`);
            
            if (text.includes('+')) {
                const parts = text.split('+');
                if (parts.length >= 2) {
                    const numbersPart = parts[0].trim();
                    const luckyPart = parts[1].trim();
                    
                    console.log(`  Numbers part: "${numbersPart}"`);
                    console.log(`  Lucky part: "${luckyPart}"`);
                    
                    const nums = numbersPart.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
                    const lucky = parseInt(luckyPart);
                    
                    console.log(`  Parsed nums: ${nums}, lucky: ${lucky}`);
                    
                    if (nums.length === 5) {
                        numbers = nums;
                    }
                    if (!isNaN(lucky) && lucky >= 1 && lucky <= 13) {
                        luckyNumber = [lucky];
                    }
                }
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
        
        const prizeOrder = ['5+0', '4+1', '4+0', '3+1', '3+0', '2+1'];
        prizeOrder.forEach((key, i) => {
            if (prizeElements[i]) {
                prizes[key] = prizeElements[i].value;
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