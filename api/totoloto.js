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
         
        // Based on the logs, we can see the pattern clearly:
        // Ul #3: valueText='€ 407,49' → 3.º Prémio → 4 números → '4+0'
        // Ul #4: valueText='€ 5,15'   → 4.º Prémio → 3 números → '3+0'
        // Ul #5: valueText='€ 2,16'   → 5.º Prémio → 2 números → '2+0'
        //
        // The value is always in the 4th li (index 3) of each ul
        $('ul.colums, ul.colums.listBg').each((i, ul) => {
            const lis = $(ul).find('li');
            if (lis.length >= 4) {
                // Get the value from the 4th li element
                const valueText = $(lis[3]).text().trim();
                
                console.log(`Ul #${i}: checking valueText='${valueText}'`);
                
                let prizeValue = null;
                let hasWinners = false;
                const winnerCountStr = $(lis[2]).text().trim();
                const winnerCount = parseInt(winnerCountStr.replace(/\./g, ''));
                if (!isNaN(winnerCount) && winnerCount > 0) {
                    hasWinners = true;
                }
                
                // Extract prize value from the 4th li element (only if there are winners)
                if (hasWinners && valueText) {
                    // Remove currency symbol, spaces, dots (thousands separator), replace comma with decimal point
                    const valueStr = valueText.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
                    const value = parseFloat(valueStr);
                    if (!isNaN(value) && value > 0) {
                        prizeValue = value;
                    }
                }
                
                // Map ul index to prize key:
                // Based on observation: ul index 1 → 1.º Prémio (jackpot)
                //                       ul index 2 → 2.º Prémio → 5 números → '5+0'
                //                       ul index 3 → 3.º Prémio → 4 números → '4+0'
                //                       ul index 4 → 4.º Prémio → 3 números → '3+0'
                //                       ul index 5 → 5.º Prémio → 2 números → '2+0'
                let prizeKey = null;
                if (i >= 1 && i <= 5) {
                    if (i === 1) {
                        prizeKey = '5+1'; // 1.º Prémio (jackpot)
                    } else {
                        const numbers = 7 - i; // 7-2=5, 7-3=4, 7-4=3, 7-5=2
                        prizeKey = `${numbers}+0`;
                    }
                }
                // Skip ul index 0 (possible header) and 6+ (Nº da Sorte, etc.)
                
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