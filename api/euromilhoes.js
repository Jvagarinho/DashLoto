const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
    const BASE_URL = 'https://www.jogossantacasa.pt/web/SCCartazResult';
    
    try {
        console.log('Scraping Euromilhões...');
        
        const response = await axios.get(BASE_URL + '/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'pt-PT,pt;q=0.9'
            },
            timeout: 20000
        });

        const $ = cheerio.load(response.data);
        
        let numbers = [];
        let stars = [];
        let date = '';
        
        const html = $.html();
        
        const numsMatch = html.match(/numbers[\s\S]*?(\d+)[\s\S]*?(\d+)[\s\S]*?(\d+)[\s\S]*?(\d+)[\s\S]*?(\d+)/i);
        
        const allNums = html.match(/\b(\d{1,2})\b/g) || [];
        
        const validNums = allNums.filter(n => {
            const num = parseInt(n);
            return num >= 1 && num <= 50;
        }).slice(0, 10);
        
        for (const n of validNums) {
            const num = parseInt(n);
            if (num <= 50 && !numbers.includes(num) && numbers.length < 5) {
                numbers.push(num);
            }
        }
        
        const starsMatch = html.match(/star[\s\S]*?(\d+)[\s\S]*?(\d+)/i);
        
        for (const n of validNums.slice(5)) {
            const num = parseInt(n);
            if (num <= 12 && !stars.includes(num) && stars.length < 2) {
                stars.push(num);
            }
        }
        
        const dateMatch = html.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dateMatch) {
            date = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
        
        const jsDataMatch = html.match(/date[\"\']\s*:\s*[\"'](\d{4}-\d{2}-\d{2})/);
        
        console.log('Números encontrados:', numbers);
        console.log('Estrelas encontradas:', stars);
        
        if (numbers.length >= 5) {
            numbers.sort((a, b) => a - b);
            stars.sort((a, b) => a - b);
            res.json({ 
                numbers: numbers.slice(0, 5), 
                stars: stars.length >= 2 ? stars.slice(0, 2) : [stars[0] || 1, 2],
                date 
            });
        } else {
            res.status(500).json({ error: 'Não foi possível extrair os dados do Euromilhões' });
        }
    } catch (error) {
        console.error('Erro Euromilhões:', error.message);
        res.status(500).json({ error: 'Erro ao obter dados: ' + error.message });
    }
};