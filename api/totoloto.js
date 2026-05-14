const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
    const BASE_URL = 'https://www.jogossantacasa.pt/web/SCCartazResult';
    
    try {
        console.log('Scraping Totoloto...');
        
        const response = await axios.get(BASE_URL + '/totolotoNew', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'pt-PT,pt;q=0.9'
            },
            timeout: 20000
        });

        const $ = cheerio.load(response.data);
        
        let numbers = [];
        let luckyNumber = [];
        let date = '';
        
        const html = $.html();
        
        const allNums = html.match(/\b(\d{1,2})\b/g) || [];
        
        const validNums = allNums.filter(n => {
            const num = parseInt(n);
            return num >= 1 && num <= 49;
        }).slice(0, 12);
        
        for (const n of validNums) {
            const num = parseInt(n);
            if (!numbers.includes(num) && numbers.length < 5) {
                numbers.push(num);
            }
        }
        
        for (const n of validNums.slice(5)) {
            const num = parseInt(n);
            if (num >= 1 && num <= 13 && !luckyNumber.includes(num) && luckyNumber.length < 1) {
                luckyNumber.push(num);
            }
        }
        
        const dateMatch = html.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dateMatch) {
            date = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
        
        console.log('Números encontrados:', numbers);
        console.log('Número da Sorte encontrado:', luckyNumber);
        
        if (numbers.length >= 5) {
            numbers.sort((a, b) => a - b);
            res.json({ 
                numbers: numbers.slice(0, 5), 
                stars: luckyNumber.length > 0 ? luckyNumber : [1],
                date 
            });
        } else {
            res.status(500).json({ error: 'Não foi possível extrair os dados do Totoloto' });
        }
    } catch (error) {
        console.error('Erro Totoloto:', error.message);
        res.status(500).json({ error: 'Erro ao obter dados: ' + error.message });
    }
};