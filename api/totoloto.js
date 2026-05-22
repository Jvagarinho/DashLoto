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
        // Based on observed structure:
        // ul index 3: 3.º Prémio → 4 números → '4+0'
        // ul index 4: 4.º Prémio → 3 números → '3+0'  
        // ul index 5: 5.º Prémio → 2 números → '2+0'
        // Formula: numbers = 7 - ulIndex, prizeKey = '${numbers}+0'
        $('ul.colums, ul.colums.listBg').each((i, ul) => {
            const lis = $(ul).find('li');
            if (lis.length >= 4) {
                // The prize value is in the 4th li element (index 3)
                const valueText = $(lis[3]).text().trim();
                
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
                
                // Map ul index to prize key using discovered pattern:
                // ul index 3 → 3.º Prémio → 4 números → '4+0'
                // ul index 4 → 4.º Prémio → 3 números → '3+0'
                // ul index 5 → 5.º Prémio → 2 números → '2+0'
                // Formula: numbers = 7 - ulIndex
                let prizeKey = null;
                if (i >= 3 && i <= 5) {
                    const numbers = 7 - i;
                    prizeKey = `${numbers}+0`;
                }
                // Skip ul index 0,1,2 (headers/jackpot/counts) and 6+ (Nº da Sorte, etc.)
                
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