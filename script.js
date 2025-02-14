// Predefined Admin Credentials
const adminCredentials = {
    username: "jaisanwariya",
    password: "Rk@10070711",
};
const BACKEND_URL = "https://seth-color-prediction.onrender.com";

// Switch between forms
document.getElementById("switchToSignup").addEventListener("click", () => {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signupForm").classList.remove("hidden");
});

document.getElementById("switchToLogin").addEventListener("click", () => {
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
});

document.getElementById("forgotPassword").addEventListener("click", () => {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("forgotPasswordForm").classList.remove("hidden");
});

document.getElementById("switchToLoginForm").addEventListener("click", () => {
    document.getElementById("forgotPasswordForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
});

// Login functionality
document.getElementById('loginButton').addEventListener('click', async () => {
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
        // Check for admin credentials internally
        if (phone === adminCredentials.username && password === adminCredentials.password) {
            alert('Welcome, Admin!');
            localStorage.setItem('username', 'admin');
            localStorage.setItem('role', 'Admin'); // Store admin role internally
            window.location.href = 'admin_dashboard.html';
            return;
        }

        // Process login for regular users
        const response = await fetch(`${BACKEND_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            alert(`Welcome, ${data.username}!`);
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred while logging in. Please try again.');
    }
});
// Signup functionality (Only for Players)
document.getElementById('signupButton').addEventListener('click', async () => {
    const phone = document.getElementById('signupPhone').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('signupPassword').value;
    const favCar = document.getElementById('favCar').value;
    const favFood = document.getElementById('favFood').value;
    const bestFriend = document.getElementById('bestFriend').value;

    if (!phone || !username || !password || !favCar || !favFood || !bestFriend) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const checkResponse = await fetch(`${BACKEND_URL}/check-phone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });

        const checkData = await checkResponse.json();
        if (checkResponse.ok && checkData.exists) {
            alert("This phone number is already registered. Please log in.");
            return;
        }
        
        const response = await fetch(`${BACKEND_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, phone, password, favCar, favFood, bestFriend }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById('switchToLogin').click();
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred during signup. Please try again.');
    }
});

// Forgot Password Functionality
document.getElementById("resetPasswordButton").addEventListener("click", async () => {
    const phoneOrUsername  = document.getElementById("forgotPhoneOrUsername").value;
    const favCar = document.getElementById("forgotFavCar").value;
    const favFood = document.getElementById("forgotFavFood").value;
    const bestFriend = document.getElementById("forgotBestFriend").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;

    if (!phoneOrUsername || !favCar || !favFood || !bestFriend || !newPassword || !confirmNewPassword) {
        alert("Please fill in all fields.");
        return;
    }

    if (newPassword !== confirmNewPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneOrUsername, favCar, favFood, bestFriend, newPassword }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById('switchToLoginForm').click(); // Redirect to login
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred while resetting your password. Please try again.');
    }
});
