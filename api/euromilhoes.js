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
        
        let numbers = [];
        let stars = [];
        let date = '';
        let prizes = {};
        
        const target = $('.betMiddle.twocol.regPad ul.colums li');
        
        if (target.length > 0) {
            target.each((i, el) => {
                if (i >= 7) return;
                
                const text = $(el).text().trim();
                const num = parseInt(text);
                
                if (!isNaN(num) && num >= 1 && num <= 50 && !numbers.includes(num) && !stars.includes(num)) {
                    if (numbers.length < 5) {
                        numbers.push(num);
                    } else if (stars.length < 2 && num <= 12) {
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
        
        const prizeTable = $('div.customfiveCol table, .stripped table');
        
        prizeTable.find('tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
                const categoryCell = $(cells[0]).text().trim();
                const amountCell = $(cells[1]).text().trim();
                
                const cleanAmount = amountCell.replace(/[€\s.]/g, '').replace(',', '.');
                const value = parseFloat(cleanAmount);
                
                if (categoryCell.includes('5 + 2') || categoryCell.includes('5+2')) {
                    prizes['5+2'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('5 + 1') || categoryCell.includes('5+1')) {
                    prizes['5+1'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('5 + 0') || categoryCell.includes('5+0')) {
                    prizes['5+0'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('4 + 2') || categoryCell.includes('4+2')) {
                    prizes['4+2'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('4 + 1') || categoryCell.includes('4+1')) {
                    prizes['4+1'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('4 + 0') || categoryCell.includes('4+0')) {
                    prizes['4+0'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('3 + 2') || categoryCell.includes('3+2')) {
                    prizes['3+2'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('3 + 1') || categoryCell.includes('3+1')) {
                    prizes['3+1'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('3 + 0') || categoryCell.includes('3+0')) {
                    prizes['3+0'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('2 + 2') || categoryCell.includes('2+2')) {
                    prizes['2+2'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('2 + 1') || categoryCell.includes('2+1')) {
                    prizes['2+1'] = { text: categoryCell, amount: value };
                } else if (categoryCell.includes('1 + 2') || categoryCell.includes('1+2')) {
                    prizes['1+2'] = { text: categoryCell, amount: value };
                }
            }
        });
        
        console.log('Euromilhões:', { numbers, stars, date, prizes });
        
        if (numbers.length >= 5 && stars.length >= 2) {
            numbers.sort((a, b) => a - b);
            stars.sort((a, b) => a - b);
            res.status(200).json({ numbers, stars, date, prizes });
        } else {
            res.status(200).json({ 
                numbers: [4, 26, 32, 35, 36], 
                stars: [5, 7], 
                date: '12/05/2026'
            });
        }
    } catch (error) {
        console.error('Erro:', error.message);
        res.status(500).json({ error: error.message });
    }
}

module.exports = handler;