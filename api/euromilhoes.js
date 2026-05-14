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
        console.log('Scraping Euromilhões...');
        
        const response = await axios.get(BASE_URL + '/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'pt-PT,pt;q=0.9'
            },
            timeout: 20000
        });

        const $ = cheerio.load(response.data);
        
        const numbers = [];
        const stars = [];
        let date = '';
        
        const columsList = $('ul.colums');
        
        if (columsList.length > 0) {
            const firstUl = columsList.first();
            
            const allLis = firstUl.find('li').toArray();
            
            for (let i = 0; i < Math.min(allLis.length, 7); i++) {
                const text = $(allLis[i]).text().trim();
                const num = parseInt(text);
                if (!isNaN(num) && num >= 1 && num <= 50) {
                    if (numbers.length < 5) {
                        numbers.push(num);
                    } else {
                        stars.push(num);
                    }
                }
            }
        }
        
        if (numbers.length < 5) {
            $('ul.colums li').each((i, el) => {
                if (numbers.length >= 5 && stars.length >= 2) return;
                const text = $(el).text().trim();
                const num = parseInt(text);
                if (!isNaN(num) && num >= 1 && num <= 50) {
                    if (numbers.length < 5) {
                        numbers.push(num);
                    } else if (num <= 12 && stars.length < 2) {
                        stars.push(num);
                    }
                }
            });
        }
        
        $('[class*="date"]').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (match && !date) {
                date = `${match[1]}/${match[2]}/${match[3]}`;
            }
        });
        
        numbers.sort((a, b) => a - b);
        stars.sort((a, b) => a - b);
        
        console.log('Euromilhões:', { numbers, stars, date });
        
        res.status(200).json({ 
            numbers, 
            stars: stars.length >= 2 ? stars : [1, 2], 
            date
        });
    } catch (error) {
        console.error('Erro:', error.message);
        res.status(500).json({ error: error.message });
    }
}

module.exports = handler;