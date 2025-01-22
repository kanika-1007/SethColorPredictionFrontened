document.addEventListener("DOMContentLoaded", () => {
    const availableBalanceElement = document.getElementById("available-balance");
    const withdrawMethod = document.getElementById("withdraw-method");
    const upiDetails = document.getElementById("upi-details");
    const bankDetails = document.getElementById("bank-details");
    const withdrawAmountInput = document.getElementById("withdraw-amount");
    const withdrawButton = document.getElementById("withdraw-button");
    const withdrawalMessage = document.getElementById("withdrawal-message");
    const tableBody = document.querySelector("#player-withdrawal-requests-table tbody");

    const viewHistoryButton = document.getElementById("view-history-button");
    const betHistoryModal = document.getElementById("bet-history-modal");
    const closeHistoryButton = document.getElementById("close-history-button");

    const username = localStorage.getItem("username"); // Get username from localStorage

    // Fetch balance from backend
    async function fetchBalance() {
        try {
            const response = await fetch(`http://localhost:3000/api/withdrawal/balance/${username}`);
            const data = await response.json();
            availableBalanceElement.textContent = data.balance || 0;
        } catch (err) {
            console.error("Error fetching balance:", err);
            withdrawalMessage.textContent = "Failed to fetch balance. Please try again.";
            withdrawalMessage.className = "withdrawal-message error";
        }
    }

    // Fetch withdrawal requests from backend
    async function fetchWithdrawalRequests() {
        try {
            const response = await fetch(`http://localhost:3000/api/withdrawal/requests/all`);
            const requests = await response.json();        
            renderWithdrawalRequests(requests);
        } catch (err) {
            console.error("Error fetching withdrawal requests:", err);
        }
    }

    // Render withdrawal requests in the table
    function renderWithdrawalRequests(requests) {
        const username = localStorage.getItem('username');
        const filteredData = requests.filter(request => request.username === username);
        tableBody.innerHTML = "";
        filteredData.forEach((request, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${request._id}</td>
                <td>${request.method}</td>
                <td>${request.details}</td>
                <td>₹${request.amount}</td>
                <td class="status ${request.status.toLowerCase()}">${request.status}</td>
                <td>${new Date(request.date).toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Submit withdrawal request to backend
    async function submitWithdrawalRequest(method, details, amount) {
        try {
            const response = await fetch(`http://localhost:3000/api/withdrawal/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, amount, method, details }),
            });

            const data = await response.json();
            if (response.ok) {
                showMessage("Request submitted successfully! Estimated time: 1-2 hours.", "success");
                fetchBalance(); // Update balance after request
                fetchWithdrawalRequests(); // Refresh requests
            } else {
                withdrawalMessage.textContent = data.message;
                withdrawalMessage.className = "withdrawal-message error";
            }
        } catch (err) {
            console.error("Error submitting withdrawal request:", err);
            withdrawalMessage.textContent = "Failed to submit request. Please try again.";
            withdrawalMessage.className = "withdrawal-message error";
        }
    }

        // Function to display messages
        function showMessage(message, type) {
            withdrawalMessage.textContent = message;
            withdrawalMessage.className = `withdrawal-message ${type}`;
            withdrawalMessage.style.display = "block";
    
            setTimeout(() => {
                withdrawalMessage.style.display = "none";
            }, 5000);
        }

    // Handle withdrawal request submission
    withdrawButton.addEventListener("click", () => {
        const method = withdrawMethod.value;
        const amount = parseInt(withdrawAmountInput.value);
        let details;

        if (!amount || amount < 100) {
            showMessage("Minimum withdrawal amount is ₹100.", "error");
            return;
        }

        if (method === "UPI") {
            details = document.getElementById("upi-id").value.trim();
            if (!details) {
                withdrawalMessage.textContent = "Please enter a valid UPI ID.";
                withdrawalMessage.className = "withdrawal-message error";
                return;
            }
        } else if (method === "Bank") {
            const accountHolder = document.getElementById("account-holder").value.trim();
            const bankName = document.getElementById("bank-name").value.trim();
            const accountNumber = document.getElementById("account-number").value.trim();
            const ifscCode = document.getElementById("ifsc-code").value.trim();

            if (!accountHolder || !bankName || !accountNumber || !ifscCode) {
                withdrawalMessage.textContent = "Please fill all bank details.";
                withdrawalMessage.className = "withdrawal-message error";
                return;
            }

            details = `Account Holder: ${accountHolder}, Bank: ${bankName}, Account Number: ${accountNumber}, IFSC: ${ifscCode}`;
        }

        submitWithdrawalRequest(method, details, amount);
        withdrawAmountInput.value = ""; // Clear input
    });

    // Show/hide UPI or Bank details
    withdrawMethod.addEventListener("change", () => {
        if (withdrawMethod.value === "UPI") {
            upiDetails.style.display = "block";
            bankDetails.style.display = "none";
        } else if (withdrawMethod.value === "Bank") {
            upiDetails.style.display = "none";
            bankDetails.style.display = "block";
        }
    });

    // Open withdrawal history modal
    viewHistoryButton.addEventListener("click", async () => {
        await fetchWithdrawalRequests();
        betHistoryModal.style.display = "flex";
    });

    // Close withdrawal history modal
    closeHistoryButton.addEventListener("click", () => {
        betHistoryModal.style.display = "none";
    });

    // Close modal when clicking outside of it
    window.addEventListener("click", (event) => {
        if (event.target === betHistoryModal) {
            betHistoryModal.style.display = "none";
        }
    });

    // Initialize balance and requests
    fetchBalance();
    fetchWithdrawalRequests();
});
