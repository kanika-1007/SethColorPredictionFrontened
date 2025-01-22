document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    const qrSubmitButton = document.getElementById('qr-submit-button');
    const manualSubmitButton = document.getElementById('manual-submit-button');
    const qrUtrInput = document.getElementById('qr-utr');
    const manualUtrInput = document.getElementById('manual-utr');
    const amountInput = document.getElementById('amount');
    const historyTableBody = document.querySelector('#add-money-requests-table tbody');
    const historyModal = document.getElementById('payment-history-modal');
    const viewHistoryButton = document.getElementById('view-history-button');
    const closeHistoryButton = document.getElementById('close-history-button');
    const messageBox = document.getElementById('add-money-message'); // Element to show success message
    const BACKEND_URL = "https://seth-color-prediction.onrender.com";

    console.log('Fetched username from localStorage:', username); // Debug
    if (!username) {
        alert('Username not found in localStorage. Please log in.');
        return;
    }
    // Fetch and display balance
    async function fetchBalance() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/add-money/balance/${username}`);
            if (!response.ok) {
                throw new Error('Failed to fetch balance');
            }
            const data = await response.json();
            document.getElementById('available-balance').textContent = data.balance || 0;
        } catch (err) {
            console.error('Error fetching balance:', err);
        }
    }

    // Submit add money request
    async function submitAddMoneyRequest(paymentType, utr) {
        const amount = parseInt(amountInput.value);

        if (!amount || amount < 100) {
            alert('Minimum amount should be ₹100.');
            return;
        }

        if (!utr.trim()) {
            alert('Please enter a valid UTR number.');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/add-money/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, amount, utr, paymentType }),
            });

            if (response.ok) {
                showMessage('Details submitted successfully! Awaiting admin confirmation. Estimated time: 10 min.', 'success');
                fetchHistory();
            } else {
                alert('Failed to submit request.');
            }
        } catch (err) {
            console.error('Error submitting request:', err);
        }
    }


    // Function to show messages dynamically
    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';

        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }

    // Fetch and display request history
    async function fetchHistory() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/add-money/requests/all`);
            if (!response.ok) {
                throw new Error('Failed to fetch history');
            }
            const data = await response.json();
            const username = localStorage.getItem('username');
            const filteredData = data.filter(request => request.username === username);

            historyTableBody.innerHTML = '';
            filteredData.forEach((request, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${request._id}</td>
                    <td>₹${request.amount}</td>
                    <td>${request.utr || 'N/A'}</td>
                    <td>${request.status}</td>
                    <td>${new Date(request.date).toLocaleString()}</td>
                `;
                historyTableBody.appendChild(row);
            });
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    }

    async function fetchAndDisplayUpiId() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/add-money/current-upi-id`);
            const data = await response.json();
            const upiIdElement = document.getElementById('upi-id');
            upiIdElement.textContent = data.upiId || 'Not Set';
        } catch (err) {
            console.error('Error fetching UPI ID:', err);
        }
    }
    
    // Copy UPI ID to Clipboard
    const copyUpiButton = document.getElementById('copy-upi-button');
    const upiIdElement = document.getElementById('upi-id');
    copyUpiButton.addEventListener('click', () => {
        const upiId = upiIdElement.textContent;
        navigator.clipboard.writeText(upiId).then(() => {
            alert('UPI ID copied to clipboard!');
        }).catch((err) => {
            console.error('Failed to copy UPI ID:', err);
        });
    });

    // Event Listeners
    qrSubmitButton.addEventListener('click', () => {
        submitAddMoneyRequest('QR Code', qrUtrInput.value.trim());
    });

    manualSubmitButton.addEventListener('click', () => {
        submitAddMoneyRequest('Manual UPI', manualUtrInput.value.trim());
    });

    // Open History Modal
    viewHistoryButton.addEventListener('click', async () => {
        await fetchHistory();
        historyModal.style.display = 'block';
    });

    // Close History Modal
    closeHistoryButton.addEventListener('click', () => {
        historyModal.style.display = 'none';
    });

    // Close Modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === historyModal) {
            historyModal.style.display = 'none';
        }
    });

    // Initialize
    fetchAndDisplayUpiId();
    fetchBalance();
    fetchHistory();
});
