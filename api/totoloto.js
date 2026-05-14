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
        console.log('Scraping Totoloto...');
        
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
        let date = '13/05/2026';
        
        const target = $('.betMiddle.twocol.regPad ul.colums li');
        
        if (target.length > 0) {
            target.each((i, el) => {
                if (i >= 6) return;
                
                const text = $(el).text().trim();
                const num = parseInt(text);
                
                if (!isNaN(num) && !numbers.includes(num) && !luckyNumber.includes(num)) {
                    if (numbers.length < 5 && num >= 1 && num <= 49) {
                        numbers.push(num);
                    } else if (luckyNumber.length < 1 && num >= 1 && num <= 13) {
                        luckyNumber.push(num);
                    }
                }
            });
        }
        
        console.log('Totoloto extraídos:', { numbers, luckyNumber });
        
        if (numbers.length >= 5) {
            numbers.sort((a, b) => a - b);
            res.status(200).json({ numbers, stars: luckyNumber, date });
        } else {
            res.status(200).json({ 
                numbers: [5, 7, 13, 21, 40], 
                stars: [7], 
                date: '13/05/2026',
                source: 'fallback'
            });
        }
    } catch (error) {
        console.error('Erro:', error.message);
        res.status(200).json({ 
            numbers: [5, 7, 13, 21, 40], 
            stars: [7], 
            date: '13/05/2026',
            source: 'fallback'
        });
    }
}

module.exports = handler;