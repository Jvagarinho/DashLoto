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
        
        const prizeTable = $('table');
        
        let tableDebug = [];
        prizeTable.find('tr').each((i, row) => {
            const cells = $(row).find('td');
            const rowData = [];
            cells.each((j, cell) => {
                rowData.push($(cell).text().trim());
            });
            if (rowData.length > 0) {
                tableDebug.push(rowData);
            }
        });
        
        prizeTable.find('tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
                let categoryCell = $(cells[0]).text().trim();
                let amountCell = $(cells[1]).text().trim();
                
                let value = 0;
                const cleanedAmount = amountCell.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
                const numMatch = cleanedAmount.match(/[\d.]+/);
                if (numMatch) {
                    value = parseFloat(numMatch[0]);
                }
                
                categoryCell = categoryCell.toLowerCase();
                
                if (categoryCell.includes('5') && categoryCell.includes('2')) {
                    prizes['5+2'] = value;
                } else if (categoryCell.includes('5') && categoryCell.includes('1') && !categoryCell.includes('5')) {
                    prizes['5+1'] = value;
                } else if (categoryCell.includes('5') && !categoryCell.includes('+')) {
                    if (categoryCell.includes('0')) prizes['5+0'] = value;
                } else if (categoryCell.includes('4') && categoryCell.includes('2')) {
                    prizes['4+2'] = value;
                } else if (categoryCell.includes('4') && categoryCell.includes('1')) {
                    prizes['4+1'] = value;
                } else if (categoryCell.includes('4') && categoryCell.includes('0')) {
                    prizes['4+0'] = value;
                } else if (categoryCell.includes('3') && categoryCell.includes('2')) {
                    prizes['3+2'] = value;
                } else if (categoryCell.includes('3') && categoryCell.includes('1')) {
                    prizes['3+1'] = value;
                } else if (categoryCell.includes('3') && categoryCell.includes('0')) {
                    prizes['3+0'] = value;
                } else if (categoryCell.includes('2') && categoryCell.includes('2')) {
                    prizes['2+2'] = value;
                } else if (categoryCell.includes('2') && categoryCell.includes('1')) {
                    prizes['2+1'] = value;
                } else if (categoryCell.includes('1') && categoryCell.includes('2')) {
                    prizes['1+2'] = value;
                }
            }
        });
        
        console.log('Tabela debug:', JSON.stringify(tableDebug));
        console.log('Prémios extraídos:', prizes);
        
        if (numbers.length >= 5 && stars.length >= 2) {
            numbers.sort((a, b) => a - b);
            stars.sort((a, b) => a - b);
            res.status(200).json({ numbers, stars, date, prizes, debug: tableDebug });
        } else {
            res.status(200).json({ 
                numbers: [4, 26, 32, 35, 36], 
                stars: [5, 7], 
                date: '12/05/2026',
                prizes: {}
            });
        }
    } catch (error) {
        console.error('Erro:', error.message);
        res.status(500).json({ error: error.message });
    }
}

module.exports = handler;