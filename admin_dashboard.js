document.addEventListener("DOMContentLoaded", () => {
    const withdrawalTile = document.getElementById("withdrawal-tile");
    const moneyAddTile = document.getElementById("money-add-tile");
    const withdrawalSection = document.getElementById("withdrawal-section");
    const moneyAddSection = document.getElementById("money-add-section");
    const withdrawalTableBody = document.getElementById("withdrawal-table-body");
    const moneyAddTableBody = document.getElementById("money-add-table-body");
    const activeBetsTableBody = document.getElementById("active-bets-table-body");
    const totalsTableBody = document.getElementById("totals-table-body");
    const resultToggle = document.getElementById('result-toggle');
    const manualResultSection = document.getElementById('manual-result-section');
    const manualResultColor = document.getElementById('manual-result-color');
    const saveManualResultButton = document.getElementById('save-manual-result');
    const upiIdInput = document.getElementById('upi-id-input');
    const updateUpiIdButton = document.getElementById('update-upi-id-button');
    const upiIdMessage = document.getElementById('upi-id-message');
    let isManualResultEnabled = false;
    let selectedColor = null;
    let currentBetNumber = 0;
    const BACKEND_URL = "https://seth-color-prediction.onrender.com";

    // Switch between sections
    withdrawalTile.addEventListener("click", () => {
        withdrawalSection.classList.remove("hidden");
        moneyAddSection.classList.add("hidden");
    });

    moneyAddTile.addEventListener("click", () => {
        moneyAddSection.classList.remove("hidden");
        withdrawalSection.classList.add("hidden");
        fetchMoneyAddRequests();
    });
     
      // Toggle Manual Result Section
// Ensure manual result is disabled by default on toggle off
resultToggle.addEventListener("change", async (event) => {
    isManualResultEnabled = event.target.checked;
    manualResultSection.style.display = isManualResultEnabled ? "block" : "none";

    if (!isManualResultEnabled) {
        selectedColor = null; // Reset selected color when disabled
        manualResultColor.value = ''; // Clear the dropdown
    }

    // Update the manual result state on the server
    try {
        await fetch(`${BACKEND_URL}/api/dashboard/manual-result-state`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isManualResultEnabled, selectedColor }),
        });
    } catch (err) {
        console.error("Error updating manual result state:", err);
    }
});

    // Save the Selected Color to the Server
    saveManualResultButton.addEventListener('click', async () => {
        selectedColor = manualResultColor.value;
        try {
            const response = await fetch(`${BACKEND_URL}/api/dashboard/set-manual-result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isManualResultEnabled, selectedColor }),
            });

            if (response.ok) {
                alert(`Manual result color set to ${selectedColor}`);
            } else {
                alert('Failed to save the manual result.');
            }
        } catch (err) {
            console.error('Error saving manual result:', err);
        }
    });

 // Fetch the Manual Result State on Page Load
// Fetch the Manual Result State on Page Load
async function fetchManualResultState() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/dashboard/manual-result-state`);
        const data = await response.json();

        // Reset manual result state
        isManualResultEnabled = false; // Default to unchecked
        selectedColor = null;

        // Update the UI
        resultToggle.checked = false; // Always reset the checkbox
        manualResultSection.style.display = 'none'; // Hide the manual result section
        manualResultColor.value = ''; // Clear selected color

        if (data.isManualResultEnabled) {
            isManualResultEnabled = true;
            selectedColor = data.selectedColor;

            // Update the UI based on server state
            resultToggle.checked = true;
            manualResultSection.style.display = 'block';
            if (selectedColor) {
                manualResultColor.value = selectedColor;
            }
        }
    } catch (err) {
        console.error('Error fetching manual result state:', err);
    }
}

     // Fetch the current bet number
    async function fetchCurrentBetNumber() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/dashboard/current-bet-number`);
            const data = await response.json();
            currentBetNumber = data.currentBetNumber || 0;
            fetchActiveBets(currentBetNumber); // Fetch active bets after getting the current bet number
        } catch (err) {
            console.error("Error fetching current bet number:", err);
        }
    }

    // Fetch active bets filtered by the current bet number
    async function fetchActiveBets(betNumber) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/dashboard/active-bets/${betNumber}`);
            const activeBets = await response.json();
            if (Array.isArray(activeBets)) {
                renderActiveBets(activeBets);
            } else {
                console.error("Invalid response for active bets:", activeBets);
            }
        } catch (err) {
            console.error("Error fetching active bets:", err);
        }
    }

    // Render the active bets in the table
    function renderActiveBets(activeBets) {
        activeBetsTableBody.innerHTML = ""; // Clear previous data
        totalsTableBody.innerHTML = ""; // Clear totals

        const totals = {}; // To calculate totals per block

        activeBets.forEach((bet, index) => {
            // Add bet amounts to totals
            if (!totals[bet.betBlock]) {
                totals[bet.betBlock] = 0;
            }
            totals[bet.betBlock] += bet.betAmount;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${bet.betNo}</td>
                <td>${bet.betBlock}</td>
                <td>₹${bet.betAmount}</td>
            `;
            activeBetsTableBody.appendChild(row);
        });

        // Render totals
        Object.entries(totals).forEach(([block, amount]) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${block}</td>
                <td>₹${amount}</td>
            `;
            totalsTableBody.appendChild(row);
        });
    }

    // Fetch and render money add requests
    async function fetchMoneyAddRequests() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/add-money/requests/all`);
            const data = await response.json();
            const sortedRequests = data.sort((a, b) => new Date(b.date) - new Date(a.date));

            moneyAddTableBody.innerHTML = ''; // Clear table body
            sortedRequests.forEach((request, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${request._id}</td>
                    <td>${request.username}</td>
                    <td>₹${request.amount}</td>
                    <td>${request.utr || 'N/A'}</td>
                    <td class="status ${request.status.toLowerCase()}">${request.status}</td>
                    <td>
                        <button class="approve-btn" data-id="${request._id}" data-action="Approve">Approve</button>
                        <button class="reject-btn" data-id="${request._id}" data-action="Reject">Reject</button>
                    </td>
                `;
                moneyAddTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching money add requests:', error);
        }
    }

    // Approve or Reject a money add request
    async function handleMoneyAddAction(requestId, action) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/add-money/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action }),
            });

            if (response.ok) {
                alert(`Request ${action.toLowerCase()}d successfully.`);
                fetchMoneyAddRequests(); // Refresh the requests list
            } else {
                alert('Failed to process the request.');
            }
        } catch (error) {
            console.error('Error approving/rejecting request:', error);
        }
    }

    // Handle actions for approval or rejection
    moneyAddTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('approve-btn') || event.target.classList.contains('reject-btn')) {
            const requestId = event.target.dataset.id;
            const action = event.target.dataset.action;
            handleMoneyAddAction(requestId, action);
        }
    });

    // Fetch withdrawal requests (placeholder for future use)
    // Fetch and render withdrawal requests
    async function fetchWithdrawalRequests() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/withdrawal/requests/all`);
            const data = await response.json();
            const sortedRequests = data.sort((a, b) => new Date(b.date) - new Date(a.date));

            withdrawalTableBody.innerHTML = ''; // Clear table body
            sortedRequests.forEach((request, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${request._id}</td>
                    <td>${request.method}</td>
                    <td>${request.details}</td>
                    <td>₹${request.amount}</td>
                    <td class="status ${request.status.toLowerCase()}">${request.status}</td>
                    <td>
                        <button class="approve-btn" data-id="${request._id}" data-action="Approve">Approve</button>
                        <button class="reject-btn" data-id="${request._id}" data-action="Reject">Reject</button>
                    </td>
                `;
                withdrawalTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching withdrawal requests:', error);
        }
    }

    // Approve or Reject a withdrawal request
    async function handleWithdrawalAction(requestId, action) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/withdrawal/update-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action }),
            });

            if (response.ok) {
                alert(`Request ${action.toLowerCase()}d successfully.`);
                fetchWithdrawalRequests(); // Refresh the requests list
            } else {
                alert('Failed to process the request.');
            }
        } catch (error) {
            console.error('Error approving/rejecting withdrawal request:', error);
        }
    }

    // Handle actions for approval or rejection for withdrawals
    withdrawalTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('approve-btn') || event.target.classList.contains('reject-btn')) {
            const requestId = event.target.dataset.id;
            const action = event.target.dataset.action;
            handleWithdrawalAction(requestId, action);
        }
    });

    // Fetch the current UPI ID
    async function fetchCurrentUpiId() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/add-money/current-upi-id`);
            const data = await response.json();
            upiIdInput.value = data.upiId || '';
        } catch (err) {
            console.error('Error fetching current UPI ID:', err);
        }
    }

    // Update the UPI ID
    updateUpiIdButton.addEventListener('click', async () => {
        const newUpiId = upiIdInput.value.trim();

        if (!newUpiId) {
            alert('Please enter a valid UPI ID.');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/add-money/update-upi-id`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newUpiId }),
            });

            if (response.ok) {
                upiIdMessage.textContent = 'UPI ID updated successfully!';
                upiIdMessage.classList.remove('hidden');
                upiIdMessage.style.color = 'green';
                setTimeout(() => {
                    upiIdMessage.classList.add('hidden');
                }, 5000);
            } else {
                upiIdMessage.textContent = 'Failed to update UPI ID.';
                upiIdMessage.classList.remove('hidden');
                upiIdMessage.style.color = 'red';
            }
        } catch (err) {
            console.error('Error updating UPI ID:', err);
        }
    });

    // Initial data fetch
    fetchCurrentBetNumber(); // Fetch current bet number and subsequently fetch active bets
    fetchMoneyAddRequests();
    fetchWithdrawalRequests();
    fetchManualResultState();
    fetchCurrentUpiId();

    setInterval(() => fetchActiveBets(currentBetNumber), 5000); // Refresh active bets every 5 seconds
     
});
