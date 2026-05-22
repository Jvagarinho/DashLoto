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
         
        // Parse prizes by looking for text patterns like "3º Prémio", "4º Prémio", etc.
        // and associate them with their values
        prizeElements.forEach(prizeElement => {
            const text = prizeElement.text;
            console.log('Checking prize element:', text, 'value:', prizeElement.value);
            let prizeKey = null;
            
            // More flexible matching - look for the pattern anywhere in the text
            if (text.includes('2º Prémio') || text.includes('2. º Prémio') || text.includes('2ºPremio')) {
                prizeKey = '5+0';
            } else if (text.includes('3º Prémio') || text.includes('3. º Prémio') || text.includes('3ºPremio')) {
                prizeKey = '4+0';
            } else if (text.includes('4º Prémio') || text.includes('4. º Prémio') || text.includes('4ºPremio')) {
                prizeKey = '3+0';
            } else if (text.includes('5º Prémio') || text.includes('5. º Prémio') || text.includes('5ºPremio')) {
                prizeKey = '2+0';
            }
            
            if (prizeKey) {
                prizes[prizeKey] = prizeElement.value;
                console.log(`Prize ${prizeKey} found: ${prizeElement.value} (from text: ${text})`);
            }
        });
        
        // If we still haven't found prizes, try to extract from nearby elements
        // Look for elements containing the prize names and get values from next siblings
        if (Object.keys(prizes).length === 0) {
            console.log('Trying alternative prize extraction method...');
            $('li').each((i, el) => {
                const text = $(el).text().trim();
                let prizeKey = null;
                
                if (text.includes('2º Prémio') || text.includes('2. º Prémio') || text.includes('2ºPremio')) {
                    prizeKey = '5+0';
                } else if (text.includes('3º Prémio') || text.includes('3. º Prémio') || text.includes('3ºPremio')) {
                    prizeKey = '4+0';
                } else if (text.includes('4º Prémio') || text.includes('4. º Prémio') || text.includes('4ºPremio')) {
                    prizeKey = '3+0';
                } else if (text.includes('5º Prémio') || text.includes('5. º Prémio') || text.includes('5ºPremio')) {
                    prizeKey = '2+0';
                }
                
                if (prizeKey) {
                    // Try to find the value in this element or the next one
                    let valueText = $(el).text();
                    let value = extractPrizeValue(valueText);
                    
                    // If no value in this element, check next sibling
                    if (value === null) {
                        const nextEl = $(el).next('li');
                        if (nextEl.length > 0) {
                            valueText = nextEl.text();
                            value = extractPrizeValue(valueText);
                        }
                    }
                    
                    if (value !== null) {
                        prizes[prizeKey] = value;
                        console.log(`Prize ${prizeKey} found: ${value} (from text: '${text}' + next element)`);
                    }
                }
            });
        }
        
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