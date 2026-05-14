const GAMES = {
    euromilhoes: {
        name: 'Euromilhões',
        numbersCount: 5,
        numbersMax: 50,
        starsCount: 2,
        starsMax: 12,
        instructions: '5 números (1-50) + 2 estrelas (1-12)',
        starsLabel: 'Estrelas'
    },
    totoloto: {
        name: 'Totoloto',
        numbersCount: 5,
        numbersMax: 49,
        starsCount: 1,
        starsMax: 13,
        instructions: '5 números (1-49) + 1 número da sorte (1-13)',
        starsLabel: 'Número da Sorte'
    }
};

const PRIZE_TABLES = {
    euromilhoes: {
        '5+2': { text: 'Jackpot! 🎉', min: 17000000 },
        '5+1': { text: '2ª Categoria', min: 500000 },
        '5+0': { text: '3ª Categoria', min: 50000 },
        '4+2': { text: '4ª Categoria', min: 5000 },
        '4+1': { text: '5ª Categoria', min: 200 },
        '3+2': { text: '6ª Categoria', min: 50 },
        '4+0': { text: '7ª Categoria', min: 30 },
        '2+2': { text: '8ª Categoria', min: 15 },
        '3+1': { text: '9ª Categoria', min: 10 },
        '3+0': { text: '10ª Categoria', min: 8 },
        '1+2': { text: '11ª Categoria', min: 8 },
        '2+1': { text: '12ª Categoria', min: 5 }
    },
    totoloto: {
        '5+1': { text: '1ª Categoria -jackpot!', min: 1000000 },
        '5+0': { text: '2ª Categoria', min: 30000 },
        '4+1': { text: '3ª Categoria', min: 1500 },
        '4+0': { text: '4ª Categoria', min: 75 },
        '3+1': { text: '5ª Categoria', min: 15 },
        '3+0': { text: '6ª Categoria', min: 5 },
        '2+1': { text: '7ª Categoria', min: 3 }
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
            date: dateObj
        };
    } catch (error) {
        console.log('Erro ao obter dados:', error.message);
        return getFallbackData();
    }
}

function getFallbackData() {
    const today = new Date();
    
    if (currentGame === 'euromilhoes') {
        return {
            numbers: [4, 26, 32, 35, 36],
            stars: [5, 7],
            date: new Date(2026, 4, 12)
        };
    } else {
        return {
            numbers: [5, 7, 13, 21, 40],
            stars: [7],
            date: new Date(2026, 4, 10)
        };
    }
}

function getFallbackData() {
    const today = new Date();
    
    if (currentGame === 'euromilhoes') {
        return {
            numbers: [12, 23, 34, 41, 48],
            stars: [4, 9],
            date: new Date(today.setDate(today.getDate() - 1)),
            prizePool: 17000000
        };
    } else {
        return {
            numbers: [5, 12, 27, 33, 41],
            stars: [7],
            date: new Date(today.setDate(today.getDate() - 1)),
            prizePool: 1500000
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
    
    let prizeKey;
    if (currentGame === 'euromilhoes') {
        prizeKey = `${matchedNumbers}+${matchedStars}`;
    } else {
        prizeKey = `${matchedNumbers}+${matchedStars}`;
    }
    
    const prizeTable = PRIZE_TABLES[currentGame];
    const prize = prizeTable[prizeKey];
    
    if (prize) {
        prizeResult.className = 'mt-6 p-6 rounded-xl text-center winner';
        prizeText.textContent = prize.text;
        prizeAmount.textContent = `€${prize.min.toLocaleString('pt-PT')}`;
    } else {
        prizeResult.className = 'mt-6 p-6 rounded-xl text-center no-win';
        prizeText.textContent = 'Sem prémio nesta categoria';
        prizeAmount.textContent = '€0';
    }
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
    
    const favorite = {
        game: currentGame,
        numbers: numbers,
        stars: stars
    };
    
    localStorage.setItem('dashloto_favorite', JSON.stringify(favorite));
    alert('⭐ Chave favorita guardada com sucesso!');
}

function loadFavorite() {
    const saved = localStorage.getItem('dashloto_favorite');
    
    if (!saved) {
        alert('Nenhuma chave favorita guardada!');
        return;
    }
    
    const favorite = JSON.parse(saved);
    
    if (favorite.game !== currentGame) {
        alert(`A chave guardada é de ${GAMES[favorite.game].name}. Mude para esse jogo para carregar.`);
        return;
    }
    
    const numberInputs = document.querySelectorAll('#numbers-input input');
    const starInputs = document.querySelectorAll('#stars-input input');
    
    favorite.numbers.forEach((num, i) => {
        if (numberInputs[i]) numberInputs[i].value = num;
    });
    
    favorite.stars.forEach((star, i) => {
        if (starInputs[i]) starInputs[i].value = star;
    });
    
    alert('📂 Chave favorita carregada!');
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

document.getElementById('save-favorite').addEventListener('click', saveFavorite);
document.getElementById('load-favorite').addEventListener('click', loadFavorite);

init();