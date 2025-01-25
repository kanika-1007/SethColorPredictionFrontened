let currentBetNumber = 1; // Start with default
const maxRows = 100; // Max rows in tables
const username = localStorage.getItem('username'); // Fetch logged-in username

let timer;
let isBetAllowed = true; // Track whether betting is allowed
let isBetPlaced = false;
let currentBetBlock = '';
let currentBetAmount = 0;
let remainingTime = 0;
let currentBalance = 0;

// DOM Elements
const userIdElement = document.getElementById('user-id');
const blocks = document.querySelectorAll('.block, .side-block');
const betModal = document.getElementById('bet-modal');
const betTitle = document.getElementById('bet-title');
const betAmountInput = document.getElementById('bet-amount');
const placeBetButton = document.getElementById('place-bet-button');
const closeModalButton = document.getElementById('close-modal-button');
const betMessage = document.getElementById('bet-message');
const balanceElement = document.getElementById('balance');
const betNumberElement = document.getElementById('bet-number');
const viewHistoryButton = document.getElementById('view-history-button');
const betHistoryModal = document.getElementById('bet-history-modal');
const closeHistoryButton = document.getElementById('close-history-button');
const BACKEND_URL = "https://seth-color-prediction.onrender.com";
const scrollContainer = document.querySelector('.scroll-container');
const modal = document.getElementById("howToPlayModal");
const btn = document.querySelector(".how-to-play-button");
const closeBtn = document.getElementById("closeModal");
scrollContainer.addEventListener('scroll', () => {
    if (scrollContainer.scrollLeft > 70) { // Limit scrolling to 300px
        scrollContainer.scrollLeft = 70;
    }
});

// Utility Functions
function generateUserId() {
    return username || 'Guest';
}

// Alphabet-to-Color Mapping and Multiplier
const alphabetColorMap = {
    A: 'Green',
    B: 'Green',
    C: 'Green',
    D: 'Green',
    E: 'Red',
    F: 'Red',
    G: 'Red',
    H: 'Red',
    I: 'Violet',
    Green: 'Green',
    Red: 'Red',
};

const multiplierMap = {
    A: 9, B: 9, C: 9, D: 9, // Green blocks
    E: 9, F: 9, G: 9, H: 9, // Red blocks
    I: 4.5,                  // Violet block
    Green: 2,                // Green side block
    Red: 2,                  // Red side block
};

function getRandomResult() {
    const alphabets = Object.keys(alphabetColorMap).filter((key) => key.length === 1);
    const randomAlphabet = alphabets[Math.floor(Math.random() * alphabets.length)];
    const color = alphabetColorMap[randomAlphabet];
    return { alphabet: randomAlphabet, color };
}

// Backend Fetch Functions
async function fetchCurrentBetNumber() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/dashboard/current-bet-number`);
        const data = await response.json();
        currentBetNumber = data.currentBetNumber || 1;
        betNumberElement.textContent = currentBetNumber;
    } catch (err) {
        console.error('Error fetching current bet number:', err);
    }
}

async function updateCurrentBetNumber() {
    try {
        await fetch(`${BACKEND_URL}/api/dashboard/update-bet-number`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentBetNumber }),
        });
    } catch (err) {
        console.error('Error updating current bet number:', err);
    }
}

async function savePlayerHistory(betNo, played, betAmount, status, amountWon, balanceAfterBet) {
    try {
        const payload = {
            username,
            historyEntry: { betNo, played, betAmount, status, amountWon, balanceAfterBet },
        };
        await fetch(`${BACKEND_URL}/api/dashboard/player-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        console.error('Error saving player history:', err);
    }
}

async function fetchPlayerHistory() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/dashboard/player-history/${username}`);
        const data = await response.json();
        const tableBody = document.querySelector('#player-history-table tbody');
        tableBody.innerHTML = '';

        if (data.playerHistory && data.playerHistory.length > 0) {
            data.playerHistory.forEach((entry) => {
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>${entry.betNo}</td>
                    <td>${entry.played}</td>
                    <td>₹${entry.betAmount}</td>
                    <td class="${entry.status === 'Win' ? 'win' : 'lose'}">${entry.status}</td>
                    <td>₹${entry.amountWon}</td>
                    <td>₹${entry.balanceAfterBet}</td>
                `;
                tableBody.appendChild(newRow);
            });
        }
    } catch (err) {
        console.error('Error fetching player history:', err);
    }
}

/ Function to update result history
async function updateResultHistory(betNo, alphabet, color) {
    const tableBody = document.querySelector('#result-history-table tbody');

    // Check if this bet number already exists in the history table
    const existingRows = tableBody.querySelectorAll('tr');
    let isDuplicate = false;
    
    existingRows.forEach(row => {
        const betNoCell = row.querySelector('td');
        if (betNoCell && betNoCell.textContent === betNo.toString()) {
            isDuplicate = true; // Mark as duplicate if found
        }
    });

    // Only add to table if it's not a duplicate
    if (!isDuplicate) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${betNo}</td>
            <td>${alphabet}</td>
            <td style="color: ${color.toLowerCase()}; font-weight: bold;">${color}</td>
        `;
        tableBody.prepend(newRow);

        // Save result to backend
        try {
            await fetch(`${BACKEND_URL}/api/dashboard/result-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resultEntry: { betNumber: betNo, alphabet, color } }),
            });
        } catch (err) {
            console.error('Error saving result history:', err);
        }
    }
}

// Ensure result history persists across page refreshes
async function fetchResultHistory() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/dashboard/result-history`);
        const history = await response.json();

        // Sort the results in descending order by betNumber
        const sortedHistory = history.sort((a, b) => b.betNumber - a.betNumber).slice(0, 100);

        const tableBody = document.querySelector('#result-history-table tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        // Render sorted history
        sortedHistory.forEach((result) => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${result.betNumber}</td>
                <td>${result.alphabet}</td>
                <td style="color: ${result.color.toLowerCase()}; font-weight: bold;">${result.color}</td>
            `;
            tableBody.appendChild(newRow);
        });
    } catch (error) {
        console.error('Error fetching result history:', error);
    }
}

async function fetchUserBalance() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/dashboard/balance/${username}`);
        const data = await response.json();
        if (data && data.balance !== undefined) {
            currentBalance = parseFloat(data.balance) || 0;
            balanceElement.textContent = currentBalance;
            localStorage.setItem('balance', currentBalance); // Cache in localStorage
            return currentBalance;
        }
    } catch (err) {
        console.error('Error fetching user balance:', err);
    }
    return 0; // Default balance if fetching fails
}

async function updateUserBalance(newBalance) {
    try {
        await fetch(`${BACKEND_URL}/api/dashboard/balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, balance: newBalance }),
        });
    } catch (err) {
        console.error('Error updating user balance:', err);
    }
}

async function saveBetForAdmin(betData) {
    try {
        await fetch(`${BACKEND_URL}/api/dashboard/active-bets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(betData),
        });
    } catch (err) {
        console.error('Error saving bet data for admin:', err);
    }
}

// Fetch the timer state from the server
async function fetchTimerState() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/dashboard/timer-state`);
        const data = await response.json();
        timeLeft = data.timeLeft;
        currentBetNumber = data.currentBetNumber;
        if (data.balance) {
            currentBalance = parseFloat(data.balance) || currentBalance;}
    } catch (err) {
        console.error('Error fetching timer state:', err);
    }
}

// Helper function to update the timer state on the server
async function updateTimerState(timeLeft, currentBetNumber) {
        try {
            await fetch(`${BACKEND_URL}/api/dashboard/update-timer-state`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ timeLeft, currentBetNumber }),
            });
        } catch (err) {
            console.error("Error updating timer state:", err);
        }
    }

async function startGlobalTimer() {
    await fetchTimerState(); // Fetch initial state from the server
        try {
            // Fetch initial timer state and current bet number from the server
    
            const timer = setInterval(async () => {
            document.getElementById("flip").textContent = timeLeft;
    
                if (timeLeft === 5) {
                    isBetAllowed = false;
                }
    
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    isBetAllowed = true;
                    
                     // Check manual result toggle and fetch manual result state
               // Generate result
                let result;
                const { isManualResultEnabled, selectedColor } = await fetchManualResultState();

                if (isManualResultEnabled && selectedColor) {
                    // Get a random alphabet corresponding to the selected color
                    const alphabetsForColor = Object.entries(alphabetColorMap)
                        .filter(([alphabet, color]) => color === selectedColor && alphabet.length === 1)
                        .map(([alphabet]) => alphabet);

                    const randomAlphabet =
                        alphabetsForColor[Math.floor(Math.random() * alphabetsForColor.length)];

                    result = { alphabet: randomAlphabet, color: selectedColor };
                } else {
                    // Default random result
                    result = getRandomResult();
                }             
                    // Generate the result for the current bet
                    const { alphabet, color } = result;
                    
                    await updateResultHistory(currentBetNumber, alphabet, color);
    
                    if (isBetPlaced) {
                        let status = "Lose";
                        let amountWon = 0;
    
                        const normalizedBetBlock = currentBetBlock.trim().toLowerCase();
                        const normalizedAlphabet = alphabet.trim().toLowerCase();
                        const normalizedColor = color.trim().toLowerCase();
    
                        // Check if bet matches the result (alphabet or color)
                        if (
                            normalizedBetBlock === normalizedAlphabet ||
                            normalizedBetBlock === normalizedColor
                        ) {
                            const mappedBlock = Object.keys(multiplierMap).find(
                                (key) => key.toLowerCase() === currentBetBlock.trim().toLowerCase()
                            );
    
                            const multiplier = mappedBlock ? multiplierMap[mappedBlock] : 0;
                            amountWon = currentBetAmount * multiplier;
                            currentBalance += amountWon;
                            status = "Win";
                        }
    
                        balanceElement.textContent = currentBalance;
                        localStorage.setItem("balance", currentBalance);

                        await updateUserBalance(currentBalance);
    
                        await savePlayerHistory(
                            currentBetNumber,
                            currentBetBlock,
                            currentBetAmount,
                            status,
                            amountWon,
                            currentBalance
                        );
    
                        isBetPlaced = false;
                        currentBetAmount = 0;
                    }
    
                    currentBetNumber++;
                    await updateCurrentBetNumber(currentBetNumber);
                    betNumberElement.textContent = currentBetNumber;
    
                    // Reset the timer state on the server for the next round
                    timeLeft = 35;
                    await updateTimerState(timeLeft, currentBetNumber);
    
                    startGlobalTimer();
                }
    
                timeLeft--;
    
                // Update timer state on the server periodically
                if (timeLeft % 1 === 0) {
                    await updateTimerState(timeLeft, currentBetNumber);
                }
            }, 1000);
        } catch (err) {
            console.error("Error initializing global timer:", err);
        }
    }

    // Fetch Manual Result State
async function fetchManualResultState() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/dashboard/manual-result-state`);
        return await response.json();
    } catch (err) {
        console.error("Error fetching manual result state:", err);
        return { isManualResultEnabled: false, selectedColor: null };
    }
}

// Event Listeners and Main Logic
document.addEventListener('DOMContentLoaded', async () => {
    userIdElement.textContent = username || 'Guest';

    try {
        // Initial balance fetch
        currentBalance = await fetchUserBalance();
        balanceElement.textContent = currentBalance;
    } catch (error) {
        console.error('Failed to fetch initial balance:', error);
    }

    await fetchResultHistory();  // Fetch global result history
    await fetchCurrentBetNumber();
    await fetchPlayerHistory();

    startGlobalTimer();

    blocks.forEach((block) => {
        block.addEventListener('click', (e) => {
            const fullText = e.target.closest('.block').textContent.trim();
            currentBetBlock = fullText.split(' ')[0];
            betTitle.textContent = `Place Your Bet on ${currentBetBlock}`;
            betModal.style.display = 'flex';
            betAmountInput.value = '';
        });
    });

    // Periodically fetch balance every 10 seconds with error handling
    setInterval(async () => {
        try {
            const updatedBalance = await fetchUserBalance();
            if (updatedBalance !== undefined && !isNaN(updatedBalance)) {
                currentBalance = updatedBalance;
                balanceElement.textContent = currentBalance;
                localStorage.setItem('balance', currentBalance);
            } else {
                console.warn("Invalid balance received:", updatedBalance);
            }
        } catch (error) {
            console.error('Error fetching balance during interval:', error);
        }
    }, 1000);

    placeBetButton.addEventListener('click', async () => {
        if (!isBetAllowed) {
            alert('Betting is disabled for the last 5 seconds.');
            return;
        }

        const betAmount = parseInt(betAmountInput.value);

        if (betAmount > currentBalance) {
            alert('Insufficient balance!');
            return;
        }

        currentBalance -= betAmount;
        balanceElement.textContent = currentBalance;
        localStorage.setItem('balance', currentBalance);

        const betData = {
            betNo: currentBetNumber,
            betBlock: currentBetBlock,
            betAmount,
        };

        await saveBetForAdmin(betData);
        await updateUserBalance(currentBalance);  // Save the updated balance to the backend

        currentBetAmount = betAmount;
        isBetPlaced = true;
        betModal.style.display = 'none';
    });

    closeModalButton.addEventListener('click', () => {
        betModal.style.display = 'none';
    });

    viewHistoryButton.addEventListener('click', async () => {
        await fetchPlayerHistory();
        betHistoryModal.style.display = 'flex';
    });

    closeHistoryButton.addEventListener('click', () => {
        betHistoryModal.style.display = 'none';
    });
    btn.onclick = function() {
        modal.style.display = "block";
    }
    // When the close button (×) is clicked, hide the modal
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});

