const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
    const BASE_URL = 'https://www.jogossantacasa.pt/web/SCCartazResult';
    
    try {
        console.log('A fazer scraping Totoloto...');
        
        const response = await axios.get(BASE_URL + '/totolotoNew', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        
        let numbers = [];
        let stars = [];
        let date = '';

        // Buscar números principais (1-49)
        $('ul.numbers-list li, .numbers-list .number, [class*="ball"]').each((i, el) => {
            const text = $(el).text().trim();
            const num = parseInt(text);
            if (!isNaN(num) && num >= 1 && num <= 49 && numbers.length < 5 && !numbers.includes(num)) {
                numbers.push(num);
            }
        });

        // Buscar número da sorte (1-13)
        $('ul.lucky-number li, .lucky-number .number, [class*="sorte"], [class*="lucky"]').each((i, el) => {
            const text = $(el).text().trim();
            const num = parseInt(text);
            if (!isNaN(num) && num >= 1 && num <= 13 && stars.length < 1 && !stars.includes(num)) {
                stars.push(num);
            }
        });

        // Buscar data
        $('[class*="date"], [class*="Data"], .draw-date').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
            if (match && !date) {
                date = `${match[1]}/${match[2]}/${match[3]}`;
            }
        });

        console.log('Totoloto extraído:', { numbers, stars, date });
        
        if (numbers.length >= 5) {
            res.json({ 
                numbers: numbers.slice(0, 5), 
                stars: stars.length > 0 ? stars.slice(0, 1) : [],
                date 
            });
        } else {
            res.status(500).json({ error: 'Não foi possível extrair os dados' });
        }
    } catch (error) {
        console.error('Erro Totoloto:', error.message);
        res.status(500).json({ error: 'Erro ao obter dados: ' + error.message });
    }
};