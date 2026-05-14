const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
    const BASE_URL = 'https://www.jogossantacasa.pt/web/SCCartazResult';
    
    try {
        console.log('Scraping Euromilhões...');
        
        const response = await axios.get(BASE_URL + '/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'Accept-Language': 'pt-PT,pt;q=0.9'
            },
            timeout: 20000
        });

        const $ = cheerio.load(response.data);
        
        let allNumbers = [];
        let date = '';
        
        $('li').each((i, el) => {
            const text = $(el).text().trim();
            const num = parseInt(text);
            if (!isNaN(num) && num >= 1 && num <= 50) {
                allNumbers.push({ num, class: $(el).attr('class'), parent: $(el).parent().attr('class') });
            }
        });
        
        $('span, p, div').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (match && !date) {
                date = `${match[1]}/${match[2]}/${match[3]}`;
            }
        });
        
        console.log('Todos os números encontrados:', allNumbers.slice(0, 20));
        
        const numbers = allNumbers.slice(0, 5).map(n => n.num);
        const stars = allNumbers.slice(5, 7).map(n => n.num);
        
        console.log('Euromilhões - Numbers:', numbers, 'Stars:', stars);
        
        res.json({ 
            numbers, 
            stars: stars.length >= 2 ? stars : [1, 2], 
            date,
            debug: allNumbers.slice(0, 15)
        });
    } catch (error) {
        console.error('Erro Euromilhões:', error.message);
        res.status(500).json({ error: error.message });
    }
};