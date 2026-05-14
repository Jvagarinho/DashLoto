const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
    const BASE_URL = 'https://www.jogossantacasa.pt/web/SCCartazResult';
    
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
        
        let numbers = [];
        let stars = [];
        let date = '';
        
        const betMiddle = $('.betMiddle.twocol.regPad');
        
        const colums = betMiddle.find('ul.colums').first();
        
        colums.find('li').each((i, el) => {
            if (i < 5) {
                const num = parseInt($(el).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 50) {
                    numbers.push(num);
                }
            }
        });
        
        colums.find('li').each((i, el) => {
            if (i >= 5 && stars.length < 2) {
                const num = parseInt($(el).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 12) {
                    stars.push(num);
                }
            }
        });
        
        $('[class*="date"], [class*="Data"]').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (match && !date) {
                date = `${match[1]}/${match[2]}/${match[3]}`;
            }
        });
        
        console.log('Euromilhões - Números:', numbers, 'Estrelas:', stars, 'Data:', date);
        
        if (numbers.length >= 5 && stars.length >= 2) {
            res.json({ numbers, stars, date });
        } else {
            res.status(500).json({ error: 'Não foi possível extrair os dados do Euromilhões' });
        }
    } catch (error) {
        console.error('Erro Euromilhões:', error.message);
        res.status(500).json({ error: 'Erro ao obter dados: ' + error.message });
    }
};