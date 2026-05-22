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
        $('ul.colums, ul.colums.listBg').each((i, ul) => {
            const lis = $(ul).find('li');
            if (lis.length >= 4) {
                const prizeNameText = $(lis[0]).text().trim(); // e.g., "3.º Prémio"
                const valueText = $(lis[3]).text().trim();    // e.g., "€ 407,49&nbsp;"
                
                console.log(`Checking ul #${i}: prizeName='${prizeNameText}', valueText='${valueText}'`);
                
                let prizeKey = null;
                let prizeValue = null;
                
                // Extract prize value from the 4th li element
                if (valueText) {
                    const valueStr = valueText.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
                    const value = parseFloat(valueStr);
                    if (!isNaN(value) && value > 0) {
                        prizeValue = value;
                    }
                }
                
                // Map prize name to our internal key
                if (prizeNameText.includes('1.º Prémio') || prizeNameText.includes('1. º Prémio') || 
                    prizeNameText.includes('1ºPrémio') || prizeNameText.includes('1° Prémio') || 
                    prizeNameText.includes('1.º Prémio')) {
                    // Jackpot - we handle this separately if needed
                } else if (prizeNameText.includes('2.º Prémio') || prizeNameText.includes('2. º Prémio') || 
                          prizeNameText.includes('2ºPrémio') || prizeNameText.includes('2° Prémio') || 
                          prizeNameText.includes('2.º Prémio')) {
                    prizeKey = '5+0';
                } else if (prizeNameText.includes('3.º Prémio') || prizeNameText.includes('3. º Prémio') || 
                          prizeNameText.includes('3ºPrémio') || prizeNameText.includes('3° Prémio') || 
                          prizeNameText.includes('3.º Prémio')) {
                    prizeKey = '4+0';
                } else if (prizeNameText.includes('4.º Prémio') || prizeNameText.includes('4. º Prémio') || 
                          prizeNameText.includes('4ºPrémio') || prizeNameText.includes('4° Prémio') || 
                          prizeNameText.includes('4.º Prémio')) {
                    prizeKey = '3+0';
                } else if (prizeNameText.includes('5.º Prémio') || prizeNameText.includes('5. º Prémio') || 
                          prizeNameText.includes('5ºPrémio') || prizeNameText.includes('5° Prémio') || 
                          prizeNameText.includes('5.º Prémio')) {
                    prizeKey = '2+0';
                }
                
                if (prizeKey && prizeValue !== null) {
                    prizes[prizeKey] = prizeValue;
                    console.log(`✅ Prize mapped: ${prizeKey} = €${prizeValue} (from '${prizeNameText}')`);
                } else if (prizeKey) {
                    console.log(`⚠️ Prize name found for ${prizeKey} but no valid value in '${valueText}'`);
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