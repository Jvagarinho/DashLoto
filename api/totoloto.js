const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
    const BASE_URL = 'https://www.jogossantacasa.pt/web/SCCartazResult';
    
    try {
        console.log('Scraping Totoloto...');
        
        const response = await axios.get(BASE_URL + '/totolotoNew', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8'
            },
            timeout: 20000
        });

        const $ = cheerio.load(response.data);
        
        let numbers = [];
        let luckyNumber = [];
        let date = '';
        
        $('ul.colums li').each((i, el) => {
            const text = $(el).text().trim();
            const num = parseInt(text);
            if (!isNaN(num)) {
                if (numbers.length < 5) {
                    numbers.push(num);
                } else if (luckyNumber.length < 1) {
                    luckyNumber.push(num);
                }
            }
        });
        
        $('*').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (match && !date) {
                date = `${match[1]}/${match[2]}/${match[3]}`;
            }
        });
        
        console.log('Totoloto extraído - Numbers:', numbers, 'Lucky:', luckyNumber, 'Date:', date);
        
        if (numbers.length >= 5) {
            res.json({ 
                numbers, 
                stars: luckyNumber.length ? luckyNumber : [1],
                date 
            });
        } else {
            res.status(500).json({ error: 'Não foi possível extrair os dados' });
        }
    } catch (error) {
        console.error('Erro Totoloto:', error.message);
        res.status(500).json({ error: error.message });
    }
};