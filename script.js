let words = [
    { english: "you tell", norwegian: "du forteller" },
    { english: "writes", norwegian: "skriver" },
    { english: "house", norwegian: "hus" },
    { english: "car", norwegian: "bil" },
];

let imageWords = [];

let currentWordIndex = 0;
let score = 0;
let timer = 10;
let timerInterval;
let gameMode = "translate";

const splashScreen = document.getElementById('splash-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const timerElement = document.getElementById('timer');
const promptElement = document.getElementById('prompt');
const upcomingPromptElement = document.getElementById('upcoming-prompt');
const responseElement = document.getElementById('response');
const scoreElement = document.getElementById('score');
const timerProgressElement = document.getElementById('timer-progress');
const imagePromptElement = document.getElementById('image-prompt');
const choicesContainer = document.getElementById('choices');

async function fetchSheetData() {
    const sheetId = 'YOUR_SHEET_ID'; // Replace with your actual sheet ID
    const sheetName = 'Sheet1'; // Replace with your sheet name
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

    try {
        const response = await fetch(url);
        const data = await response.text();
        const rows = data.split('\n').map(row => row.split(','));
        
        // Assuming your spreadsheet has columns: image_url, correct_word, alt1, alt2, alt3
        imageWords = rows.slice(1).map(row => ({
            image: row[0].replace(/"/g, ''),
            word: row[1].replace(/"/g, ''),
            alternatives: [row[2], row[3], row[4]].map(alt => alt.replace(/"/g, ''))
        }));

        console.log('Data fetched successfully:', imageWords);
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        throw error; // Rethrow the error to be caught in startGame
    }
}

async function startGame() {
    startButton.disabled = true;
    startButton.textContent = 'Loading...';

    try {
        await fetchSheetData();
        gameMode = document.querySelector('input[name="gameMode"]:checked').value;
        splashScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        resetGame();
        showNextPrompt();
    } catch (error) {
        console.error('Error starting game:', error);
        // Handle error (e.g., show error message to user)
    } finally {
        startButton.disabled = false;
        startButton.textContent = 'START';
    }
}

function resetGame() {
    currentWordIndex = 0;
    score = 0;
    scoreElement.textContent = score;
    clearInterval(timerInterval);
}

function showNextPrompt() {
    if (gameMode === "translate") {
        showTranslationPrompt();
    } else {
        showImagePrompt();
    }
    resetTimer();
}

function showTranslationPrompt() {
    if (currentWordIndex >= words.length) {
        currentWordIndex = 0;
    }
    promptElement.textContent = words[currentWordIndex].english;
    upcomingPromptElement.textContent = words[(currentWordIndex + 1) % words.length].norwegian;
    responseElement.style.display = 'block';
    choicesContainer.style.display = 'none';
    imagePromptElement.style.display = 'none';
}

function showImagePrompt() {
    if (currentWordIndex >= imageWords.length) {
        currentWordIndex = 0;
    }
    const currentImage = imageWords[currentWordIndex];
    imagePromptElement.src = currentImage.image;
    imagePromptElement.style.display = 'block';
    responseElement.style.display = 'none';
    choicesContainer.style.display = 'grid';
    choicesContainer.innerHTML = '';
    
    const choices = [currentImage.word, ...currentImage.alternatives];
    shuffleArray(choices);
    
    choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.classList.add('choice-button');
        button.addEventListener('click', () => checkImageChoice(choice));
        choicesContainer.appendChild(button);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timer = 10;
    updateTimerDisplay();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    timer--;
    updateTimerDisplay();
    if (timer <= 0) {
        clearInterval(timerInterval);
        showNextPrompt();
    }
}

function updateTimerDisplay() {
    timerElement.textContent = `${Math.floor(timer / 60).toString().padStart(2, '0')}:${(timer % 60).toString().padStart(2, '0')}`;
    timerProgressElement.style.width = `${timer * 10}%`;
}

function checkTranslationAnswer() {
    const userAnswer = responseElement.value.trim().toLowerCase();
    const correctAnswer = words[currentWordIndex].norwegian.toLowerCase();
    
    if (userAnswer === correctAnswer) {
        const pointsEarned = Math.max(11 - (10 - timer), 1);
        score += pointsEarned;
        scoreElement.textContent = score;
    }

    responseElement.value = '';
    currentWordIndex++;
    showNextPrompt();
}

function checkImageChoice(choice) {
    const currentImage = imageWords[currentWordIndex];
    const buttons = choicesContainer.querySelectorAll('.choice-button');
    
    buttons.forEach(button => {
        if (button.textContent === currentImage.word) {
            button.classList.add('correct');
        }
        if (button.textContent === choice && choice !== currentImage.word) {
            button.classList.add('incorrect');
        }
        button.disabled = true;
    });

    if (choice === currentImage.word) {
        const pointsEarned = Math.max(11 - (10 - timer), 1);
        score += pointsEarned;
        scoreElement.textContent = score;
    }

    setTimeout(() => {
        currentWordIndex++;
        showNextPrompt();
    }, 750);
}

responseElement.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        checkTranslationAnswer();
    }
});

startButton.addEventListener('click', startGame);