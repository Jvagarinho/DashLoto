const GAMES = {
    euromilhoes: {
        name: 'Euromilhões',
        numbersCount: 5,
        numbersMax: 50,
        starsCount: 2,
        starsMax: 12,
        maxFavorites: 5,
        instructions: '5 números (1-50) + 2 estrelas (1-12)',
        starsLabel: 'Estrelas'
    },
    totoloto: {
        name: 'Totoloto',
        numbersCount: 5,
        numbersMax: 49,
        starsCount: 1,
        starsMax: 13,
        maxFavorites: 10,
        instructions: '5 números (1-49) + 1 número da sorte (1-13)',
        starsLabel: 'Número da Sorte'
    }
};

const PRIZE_TABLES = {
    euromilhoes: {
        '5+2': { text: 'Jackpot! 🎉' },
        '5+1': { text: '2º Prémio' },
        '5+0': { text: '3º Prémio' },
        '4+2': { text: '4º Prémio' },
        '4+1': { text: '5º Prémio' },
        '3+2': { text: '6º Prémio' },
        '4+0': { text: '7º Prémio' },
        '2+2': { text: '8º Prémio' },
        '3+1': { text: '9º Prémio' },
        '3+0': { text: '10º Prémio' },
        '1+2': { text: '11º Prémio' },
        '2+1': { text: '12º Prémio' },
        '2+0': { text: '13º Prémio' }
    },
    totoloto: {
        '5+0': { text: '2º Prémio' },
        '4+0': { text: '3º Prémio' },
        '3+0': { text: '4º Prémio' },
        '2+0': { text: '5º Prémio' },
        '0+1': { text: 'Reembolso' }
    }
};

let currentGame = 'euromilhoes';
let currentDraw = null;

const API_BASE = '/api';

async function fetchDrawResults() {
    try {
        const apiUrl = currentGame === 'euromilhoes' 
            ? `${API_BASE}/euromilhoes`
            : `${API_BASE}/totoloto`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('API não disponível');
        }
        
        const data = await response.json();
        
        let dateObj;
        if (data.date) {
            const parts = data.date.split('/');
            dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
            dateObj = new Date();
        }
        
        return {
            numbers: data.numbers,
            stars: data.stars,
            date: dateObj,
            prizes: data.prizes || null
        };
    } catch (error) {
        console.log('Erro ao obter dados:', error.message);
        return getFallbackData();
    }
}

function getFallbackData() {
    if (currentGame === 'euromilhoes') {
        return {
            numbers: [4, 26, 32, 35, 36],
            stars: [5, 7],
            date: new Date(2026, 4, 12),
            prizes: {}
        };
    } else {
        return {
            numbers: [5, 7, 13, 21, 40],
            stars: [7],
            date: new Date(2026, 4, 13),
            prizes: {}
        };
    }
}

function renderDrawnNumbers(numbers, stars) {
    const numbersContainer = document.getElementById('drawn-numbers');
    const starsContainer = document.getElementById('drawn-stars');
    
    numbersContainer.innerHTML = numbers.map(num => 
        `<div class="drawn-number">${num}</div>`
    ).join('');
    
    starsContainer.innerHTML = stars.map(star => 
        `<div class="drawn-star">${star}</div>`
    ).join('');
}

function checkTicket(userNumbers, userStars) {
    const userNumbersSet = new Set(userNumbers);
    const userStarsSet = new Set(userStars);
    
    const matchedNumbers = currentDraw.numbers.filter(n => userNumbersSet.has(n)).length;
    const matchedStars = currentDraw.stars.filter(s => userStarsSet.has(s)).length;
    
    document.getElementById('matched-numbers').textContent = matchedNumbers;
    document.getElementById('matched-stars').textContent = matchedStars;
    
    const userNumbersHtml = userNumbers.map((num, i) => {
        const isMatched = currentDraw.numbers.includes(num);
        return `<div class="user-number ${isMatched ? 'matched' : ''}">${num}</div>`;
    }).join('');
    
    const userStarsHtml = userStars.map((star, i) => {
        const isMatched = currentDraw.stars.includes(star);
        return `<div class="user-star ${isMatched ? 'matched' : ''}">${star}</div>`;
    }).join('');
    
    document.getElementById('user-numbers').innerHTML = userNumbersHtml;
    document.getElementById('user-stars').innerHTML = userStarsHtml;
    
    calculatePrize(matchedNumbers, matchedStars);
}

function calculatePrize(matchedNumbers, matchedStars) {
    const prizeResult = document.getElementById('prize-result');
    const prizeText = document.getElementById('prize-text');
    const prizeAmount = document.getElementById('prize-amount');
    
    const prizeKey = `${matchedNumbers}+${matchedStars}`;
    
    const prizeTable = PRIZE_TABLES[currentGame];
    const fallbackPrize = prizeTable[prizeKey];
    
    let prizeTextValue = '';
    let prizeAmountValue = null; // null means not found, 0 means found but zero amount
    let isPrizeFound = false;
    
    console.log('Prize check:', prizeKey, 'currentDraw.prizes:', currentDraw.prizes);
    
    // Check if we have this prize in our scraped data
    if (currentDraw.prizes && currentDraw.prizes.hasOwnProperty(prizeKey)) {
        const scrapedPrize = currentDraw.prizes[prizeKey];
        prizeTextValue = fallbackPrize ? fallbackPrize.text : prizeKey;
        if (typeof scrapedPrize === 'number') {
            prizeAmountValue = scrapedPrize;
            isPrizeFound = true;
            console.log(`✅ Prize found for key ${prizeKey}: €${prizeAmountValue}`);
        } else if (scrapedPrize !== null && typeof scrapedPrize === 'object' && scrapedPrize.amount !== undefined) {
            prizeAmountValue = scrapedPrize.amount;
            isPrizeFound = true;
            console.log(`✅ Prize found for key ${prizeKey}: €${prizeAmountValue}`);
        } else {
            console.log(`⚠️ Prize ${prizeKey} found but has invalid/unparseable value:`, scrapedPrize);
            // Still consider it found, but with 0 amount
            prizeAmountValue = 0;
            isPrizeFound = true;
        }
    } else {
        console.log(`❌ Prize ${prizeKey} NOT found in currentDraw.prizes`);
        console.log('Available prizes:', Object.keys(currentDraw.prizes || {}));
    }
    
    if (isPrizeFound) {
        // We found the prize in the scraped data (even if amount is 0)
        prizeResult.className = 'mt-6 p-6 rounded-xl text-center winner';
        prizeText.textContent = prizeTextValue;
        prizeAmount.textContent = `€${prizeAmountValue !== null ? prizeAmountValue.toLocaleString('pt-PT') : '0'}`;
    } else if (fallbackPrize) {
        // We didn't find the prize in scraped data but we know what it should be called
        prizeResult.className = 'mt-6 p-6 rounded-xl text-center winner';
        prizeText.textContent = fallbackPrize.text;
        prizeAmount.textContent = '€0 (valor não disponível no site)';
    } else {
        // No prize at all for this match combination
        prizeResult.className = 'mt-6 p-6 rounded-xl text-center no-win';
        prizeText.textContent = 'Sem prémio nesta categoria';
        prizeAmount.textContent = '€0';
    }
}

const STORAGE_KEY = 'dashloto_favorites';

function getFavorites() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const all = saved ? JSON.parse(saved) : { euromilhoes: [], totoloto: [] };
        if (!all.euromilhoes) all.euromilhoes = [];
        if (!all.totoloto) all.totoloto = [];
        return all;
    } catch {
        return { euromilhoes: [], totoloto: [] };
    }
}

function saveFavorites(all) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function saveFavorite() {
    const numbers = Array.from(document.querySelectorAll('#numbers-input input'))
        .map(input => parseInt(input.value))
        .filter(n => !isNaN(n));
    
    const stars = Array.from(document.querySelectorAll('#stars-input input'))
        .map(input => parseInt(input.value))
        .filter(n => !isNaN(n));
    
    if (numbers.length < 5 || stars.length < GAMES[currentGame].starsCount) {
        alert('Preencha todos os campos antes de guardar!');
        return;
    }
    
    const all = getFavorites();
    const gameFavorites = all[currentGame];
    const maxFav = GAMES[currentGame].maxFavorites;
    
    if (gameFavorites.length >= maxFav) {
        alert(`Limite máximo de ${maxFav} chaves atingido para ${GAMES[currentGame].name}!`);
        return;
    }
    
    gameFavorites.push({ numbers, stars });
    saveFavorites(all);
    renderFavorites();
    alert(`⭐ Chave guardada! (${gameFavorites.length}/${maxFav})`);
}

function deleteFavorite(index) {
    const all = getFavorites();
    all[currentGame].splice(index, 1);
    saveFavorites(all);
    renderFavorites();
}

function loadFavorite(index) {
    const all = getFavorites();
    const fav = all[currentGame][index];
    if (!fav) return;
    
    const numberInputs = document.querySelectorAll('#numbers-input input');
    const starInputs = document.querySelectorAll('#stars-input input');
    
    fav.numbers.forEach((num, i) => {
        if (numberInputs[i]) numberInputs[i].value = num;
    });
    
    fav.stars.forEach((star, i) => {
        if (starInputs[i]) starInputs[i].value = star;
    });
}

function renderFavorites() {
    const container = document.getElementById('favorites-list');
    const countEl = document.getElementById('favorites-count');
    const maxEl = document.getElementById('favorites-max');
    const section = document.getElementById('favorites-section');
    
    if (!container) return;
    
    const all = getFavorites();
    const gameFavorites = all[currentGame];
    const maxFav = GAMES[currentGame].maxFavorites;
    
    if (countEl) countEl.textContent = gameFavorites.length;
    if (maxEl) maxEl.textContent = maxFav;

    if (gameFavorites.length === 0) {
        section.classList.add('hidden');
    }
    
    container.innerHTML = gameFavorites.map((fav, idx) => {
        const numbersHtml = fav.numbers.map(n => `<span class="fav-number">${n}</span>`).join('');
        const starsHtml = fav.stars.map(s => `<span class="fav-star">${s}</span>`).join('');
        return `
            <div class="fav-item">
                <div class="fav-key">${numbersHtml} ${fav.stars.length > 0 ? '· ' + starsHtml : ''}</div>
                <div class="fav-actions">
                    <button class="fav-btn-load" data-index="${idx}" title="Carregar">📂</button>
                    <button class="fav-btn-del" data-index="${idx}" title="Apagar">✕</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Attach event listeners
    container.querySelectorAll('.fav-btn-load').forEach(btn => {
        btn.addEventListener('click', () => loadFavorite(parseInt(btn.dataset.index)));
    });
    container.querySelectorAll('.fav-btn-del').forEach(btn => {
        btn.addEventListener('click', () => deleteFavorite(parseInt(btn.dataset.index)));
    });
}

async function verifyAllFavorites() {
    const all = getFavorites();
    const gameFavorites = all[currentGame];
    if (gameFavorites.length === 0) return;
    
    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');
    
    try {
        currentDraw = await fetchDrawResults();
        
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('draw-date').textContent = currentDraw.date.toLocaleDateString('pt-PT', dateOptions);
        
        renderDrawnNumbers(currentDraw.numbers, currentDraw.stars);
        
        // Build multi-results
        const multiContainer = document.getElementById('multi-results');
        const multiSection = document.getElementById('multi-result-section');
        multiSection.classList.remove('hidden');
        multiContainer.innerHTML = gameFavorites.map((fav, idx) => {
            const userNumbersSet = new Set(fav.numbers);
            const userStarsSet = new Set(fav.stars);
            
            const matchedNumbers = currentDraw.numbers.filter(n => userNumbersSet.has(n)).length;
            const matchedStars = currentDraw.stars.filter(s => userStarsSet.has(s)).length;
            
            const prizeKey = `${matchedNumbers}+${matchedStars}`;
            const prizeTable = PRIZE_TABLES[currentGame];
            const fallbackPrize = prizeTable[prizeKey];
            
            let prizeText = 'Sem prémio';
            let prizeAmount = '0';
            
            if (fallbackPrize) {
                prizeText = fallbackPrize.text;
            }
            
            if (currentDraw.prizes && currentDraw.prizes[prizeKey] !== undefined) {
                const val = currentDraw.prizes[prizeKey];
                if (typeof val === 'number' && val > 0) {
                    prizeAmount = val.toLocaleString('pt-PT');
                }
            } else if (prizeKey === '0+1') {
                prizeAmount = '2,00';
            }
            
            const numbersHtml = fav.numbers.map(n => {
                const match = currentDraw.numbers.includes(n);
                return `<span class="user-number ${match ? 'matched' : ''}">${n}</span>`;
            }).join('');
            
            const starsHtml = fav.stars.map(s => {
                const match = currentDraw.stars.includes(s);
                return `<span class="user-star ${match ? 'matched' : ''}">${s}</span>`;
            }).join('');
            
            const isWin = (fallbackPrize && currentDraw.prizes && currentDraw.prizes[prizeKey] !== undefined) || prizeKey === '0+1';
            
            return `
                <div class="multi-result-item ${isWin ? 'winner' : 'no-win'}">
                    <div class="multi-result-header">Chave ${idx + 1}</div>
                    <div class="multi-result-numbers">${numbersHtml} ${fav.stars.length > 0 ? '<span class="separator">·</span>' : ''} ${starsHtml}</div>
                    <div class="multi-result-matches">
                        <span class="match-badge blue">${matchedNumbers} números</span>
                        <span class="match-badge purple">${matchedStars} ${currentGame === 'totoloto' ? 'sorte' : 'estrelas'}</span>
                    </div>
                    <div class="multi-result-prize">
                        <span class="prize-label">${prizeText}</span>
                        <span class="prize-value">€${prizeAmount}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Show only the first key in the single result view (for reference)
        const firstFav = gameFavorites[0];
        const firstNumbersSet = new Set(firstFav.numbers);
        const firstStarsSet = new Set(firstFav.stars);
        const firstMatchedNumbers = currentDraw.numbers.filter(n => firstNumbersSet.has(n)).length;
        const firstMatchedStars = currentDraw.stars.filter(s => firstStarsSet.has(s)).length;
        
        document.getElementById('matched-numbers').textContent = firstMatchedNumbers;
        document.getElementById('matched-stars').textContent = firstMatchedStars;
        
        const userNumbersHtml = firstFav.numbers.map(n => {
            const match = currentDraw.numbers.includes(n);
            return `<div class="user-number ${match ? 'matched' : ''}">${n}</div>`;
        }).join('');
        
        const userStarsHtml = firstFav.stars.map(s => {
            const match = currentDraw.stars.includes(s);
            return `<div class="user-star ${match ? 'matched' : ''}">${s}</div>`;
        }).join('');
        
        document.getElementById('user-numbers').innerHTML = userNumbersHtml;
        document.getElementById('user-stars').innerHTML = userStarsHtml;
        
        calculatePrize(firstMatchedNumbers, firstMatchedStars);
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao verificar as chaves. Tente novamente.');
    } finally {
        loading.classList.add('hidden');
    }
}

function switchGame(game) {
    currentGame = game;
    const config = GAMES[game];
    
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.game === game);
    });
    
    document.getElementById('game-instructions').textContent = config.instructions;
    document.getElementById('stars-label').textContent = config.starsLabel;
    document.getElementById('stars-title').textContent = config.starsLabel;
    
    const starsInput = document.getElementById('stars-input');
    starsInput.innerHTML = '';
    for (let i = 0; i < config.starsCount; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 1;
        input.max = config.starsMax;
        input.placeholder = '#';
        input.className = 'star-input w-14 h-14 text-center text-lg border-2 border-gray-300 rounded-lg focus:border-santa-500 focus:ring-2 focus:ring-santa-200 outline-none';
        input.required = true;
        starsInput.appendChild(input);
    }
    
    const numberInputs = document.querySelectorAll('#numbers-input input');
    numberInputs.forEach(input => {
        input.max = config.numbersMax;
    });
    
    currentDraw = null;
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('multi-result-section').classList.add('hidden');
    renderFavorites();
}

function toggleFavorites() {
    const section = document.getElementById('favorites-section');
    const all = getFavorites();
    const gameFavorites = all[currentGame];
    
    if (gameFavorites.length === 0) {
        alert('Nenhuma chave guardada!');
        return;
    }
    
    const isHidden = section.classList.contains('hidden');
    section.classList.toggle('hidden');
    
    if (isHidden) {
        renderFavorites();
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

async function init() {
    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');
    
    try {
        currentDraw = await fetchDrawResults();
        
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('draw-date').textContent = currentDraw.date.toLocaleDateString('pt-PT', dateOptions);
        
        renderDrawnNumbers(currentDraw.numbers, currentDraw.stars);
    } catch (error) {
        console.error('Erro ao carregar resultados:', error);
        alert('Erro ao carregar resultados. Tente novamente mais tarde.');
    } finally {
        loading.classList.add('hidden');
    }
    
    renderFavorites();
}

document.getElementById('btn-euromilhoes').addEventListener('click', () => switchGame('euromilhoes'));
document.getElementById('btn-totoloto').addEventListener('click', () => switchGame('totoloto'));

document.getElementById('ticket-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');
    
    try {
        currentDraw = await fetchDrawResults();
        
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('draw-date').textContent = currentDraw.date.toLocaleDateString('pt-PT', dateOptions);
        
        const numbers = Array.from(document.querySelectorAll('#numbers-input input'))
            .map(input => parseInt(input.value));
        
        const stars = Array.from(document.querySelectorAll('#stars-input input'))
            .map(input => parseInt(input.value));
        
        const resultSection = document.getElementById('result-section');
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
        renderDrawnNumbers(currentDraw.numbers, currentDraw.stars);
        checkTicket(numbers, stars);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao verificar a chave. Tente novamente.');
    } finally {
        loading.classList.add('hidden');
    }
});

function exportFavorites() {
    const all = getFavorites();
    const total = all.euromilhoes.length + all.totoloto.length;
    if (total === 0) {
        alert('Não há chaves guardadas para exportar!');
        return;
    }

    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `dashloto_chaves_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importFavorites(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.euromilhoes || !data.totoloto) {
                throw new Error('Formato inválido');
            }
            const current = getFavorites();
            current.euromilhoes = data.euromilhoes;
            current.totoloto = data.totoloto;
            saveFavorites(current);
            renderFavorites();
            alert('Chaves importadas com sucesso!');
        } catch {
            alert('Ficheiro inválido. Selecione um ficheiro .json gerado pela exportação.');
        }
    };
    reader.readAsText(file);
}

document.getElementById('save-favorite').addEventListener('click', saveFavorite);
document.getElementById('verify-all').addEventListener('click', verifyAllFavorites);
document.getElementById('toggle-favorites').addEventListener('click', toggleFavorites);
document.getElementById('export-favorites').addEventListener('click', exportFavorites);
document.getElementById('import-favorites').addEventListener('click', () => {
    document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        importFavorites(e.target.files[0]);
        e.target.value = '';
    }
});

init();