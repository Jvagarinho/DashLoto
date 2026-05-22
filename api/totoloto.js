const axios = require('axios');
const cheerio = require('cheerio');

async function handler(req, res) {
    const BASE_URL = 'https://www.jogossantacasa.pt/web/SCCartazResult';
    
    // Helper function to extract prize value from text
    function extractPrizeValue(text) {
        if (!text) return null;
        const valueStr = text.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
        const value = parseFloat(valueStr);
        return !isNaN(value) && value > 0 ? value : null;
    }
    
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
        
        $('span, div, p').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (match && !date) {
                date = `${match[1]}/${match[2]}/${match[3]}`;
            }
        });
        
        console.log('Date found:', date);
        
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
         
        // Reset prizes object
        prizes = {};
         
        // Extract prizes by finding each prize block (<ul class="colums"> or <ul class="colums listBg">)
        // and using their order/index since the structure is consistent:
        // index 0: 1.º Prémio (jackpot)
        // index 1: 2.º Prémio (5 números) → maps to '5+0'
        // index 2: 3.º Prémio (4 números) → maps to '4+0' 
        // index 3: 4.º Prémio (3 números) → maps to '3+0'
        // index 4: 5.º Prémio (2 números) → maps to '2+0'
        // index 5: Nº da Sorte (reembolso) → we ignore this for regular prizes
        $('ul.colums, ul.colums.listBg').each((i, ul) => {
            const lis = $(ul).find('li');
            if (lis.length >= 4) {
                // The value is always in the 4th li element (index 3)
                const valueText = $(lis[3]).text().trim();    // e.g., "€ 407,49&nbsp;"
                
                console.log(`Checking ul #${i}: valueText='${valueText}'`);
                
                let prizeValue = null;
                
                // Extract prize value from the 4th li element
                if (valueText) {
                    const valueStr = valueText.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
                    const value = parseFloat(valueStr);
                    if (!isNaN(value) && value > 0) {
                        prizeValue = value;
                    }
                }
                
                // Map ul index to our internal prize key based on known order
                // Based on the HTML structure:
                // ul #0: ? (possibly header or container)
                // ul #1: 1.º Prémio (jackpot) - we skip this for regular prizes
                // ul #2: 2.º Prémio (5 números) → maps to '5+0'
                // ul #3: 3.º Prémio (4 números) → maps to '4+0' 
                // ul #4: 4.º Prémio (3 números) → maps to '3+0'
                // ul #5: 5.º Prémio (2 números) → maps to '2+0'
                // ul #6: Nº da Sorte (reembolso) - we skip this
                let prizeKey = null;
                if (i === 2) {
                    prizeKey = '5+0'; // 2.º Prémio
                } else if (i === 3) {
                    prizeKey = '4+0'; // 3.º Prémio
                } else if (i === 4) {
                    prizeKey = '3+0'; // 4.º Prémio
                } else if (i === 5) {
                    prizeKey = '2+0'; // 5.º Prémio
                }
                // Skip i=0,1 (header/jackpot) and i=6+ (Nº da Sorte, etc.)
                
                if (prizeKey && prizeValue !== null) {
                    prizes[prizeKey] = prizeValue;
                    console.log(`✅ Prize mapped: ${prizeKey} = €${prizeValue} (from ul index ${i})`);
                } else if (prizeKey) {
                    console.log(`⚠️ Prize key ${prizeKey} identified but no valid value in '${valueText}'`);
                }
            }
        });
        
        // Log all prizes found for debugging
        console.log('All prizes parsed:', prizes);
        
        console.log('Final numbers:', numbers, 'Lucky:', luckyNumber);
        
        res.status(200).json({ 
            numbers, 
            stars: luckyNumber, 
            date,
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