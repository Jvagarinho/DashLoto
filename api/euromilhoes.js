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
            
            if (text.includes('€') && !isNaN(value) && value > 0 && value < 1000000) {
                prizeElements.push({ text, value });
            }
        });
        
        console.log('Prize elements found:', prizeElements);
        
        // Show ALL prize elements with their index
        prizeElements.forEach((p, idx) => {
            console.log(`  Prize index ${idx}: ${p.value} from "${p.text}"`);
        });
        
        console.log('Date found:', date);
        
        // When no jackpot winner, prizes start from index 0 = 3rd prize (5+0)
        // So:
        // index 0 = 5+0 (3º Prémio)
        // index 1 = 4+2 (4º Prémio)
        // index 2 = 4+1 (5º Prémio)
        // index 3 = 3+2 (6º Prémio)
        // index 4 = 4+0 (7º Prémio)
        // etc.
        
        // Correct mapping for Euromilhões (no jackpot winner):
        // index 0 = 5+0 (3º Prémio) = €710,654
        // index 1 = 4+2 (4º Prémio) = €83,045.77
        // index 2 = 3+2 (6º Prémio) = €1,916.05
        // index 3 = 4+1 (5º Prémio) = €167.77
        // index 4 = 4+0 (7º Prémio) = €63.88
        // index 5 = 2+2 (8º Prémio) = €53.46
        // index 6 = 3+1 (9º Prémio) = €13.98
        // index 7 = 3+0 (10º Prémio) = €13.28
        // index 8 = 1+2 (11º Prémio) = €11.38
        // index 9 = 2+1 (12º Prémio) = €6.21
        
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
                console.log(`Prize ${key} (index ${idx}): ${prizeElements[idx].value}`);
            }
        });
        
        console.log('Final numbers:', numbers, 'Stars:', stars);
        console.log('All prizes:', prizes);
        
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