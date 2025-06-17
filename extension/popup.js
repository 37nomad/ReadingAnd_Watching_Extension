// --- CONFIGURATION ---
// IMPORTANT: Replace this with your actual backend URL
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- DOM ELEMENTS ---
const loadingSpinner = document.getElementById('loading-spinner');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const formTitle = document.getElementById('form-title');

const messageArea = document.getElementById('message-area');
const welcomeMessage = document.getElementById('welcome-message');

const switchToSignupLink = document.getElementById('switch-to-signup');
const switchToLoginLink = document.getElementById('switch-to-login');
const logoutBtn = document.getElementById('logout-btn');

// --- HELPER FUNCTIONS ---

/**
 * Toggles the visibility of major UI sections.
 * @param {'auth' | 'app' | 'loading'} view The view to show.
 */
function showView(view) {
    authContainer.classList.add('hidden');
    appContainer.classList.add('hidden');
    loadingSpinner.classList.add('hidden');

    if (view === 'auth') {
        authContainer.classList.remove('hidden');
    } else if (view === 'app') {
        appContainer.classList.remove('hidden');
    } else if (view === 'loading') {
        loadingSpinner.classList.remove('hidden');
    }
}

/**
 * Displays a message to the user (e.g., an error).
 * @param {string} text The message to display.
 * @param {boolean} isError True if it's an error message.
 */
function displayMessage(text, isError = false) {
    messageArea.textContent = text;
    messageArea.className = isError ? 'error' : 'success'; // You can add a .success class in CSS if needed
    messageArea.style.display = 'block';
}

function hideMessage() {
    messageArea.style.display = 'none';
    messageArea.textContent = '';
}

/**
 * Toggles between the login and signup forms.
 */
function toggleForms() {
    hideMessage();
    const isLoginVisible = !loginForm.classList.contains('hidden');
    if (isLoginVisible) {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        switchToSignupLink.classList.add('hidden');
        switchToLoginLink.classList.remove('hidden');
        formTitle.textContent = 'Sign Up';
    } else {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        switchToSignupLink.classList.remove('hidden');
        switchToLoginLink.classList.add('hidden');
        formTitle.textContent = 'Login';
    }
}


/**
 * Generic API request handler.
 * @param {string} endpoint The API endpoint (e.g., '/auth/login').
 * @param {object} options Fetch options (method, headers, body).
 * @returns {Promise<any>} The JSON response from the API.
 */
async function apiRequest(endpoint, options = {}) {
    const { token } = await chrome.storage.local.get('token');
    
    const headers = new Headers({
        'Content-Type': 'application/json',
        ...options.headers,
    });
    
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// --- CORE LOGIC ---

async function handleLogin(e) {
    e.preventDefault();
    hideMessage();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const button = loginForm.querySelector('button');
    button.disabled = true;

    try {
        const data = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        await chrome.storage.local.set({ token: data.token });
        showLoggedInView(data.user);
    } catch (err) {
        displayMessage(err.message, true);
    } finally {
        button.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    hideMessage();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const button = signupForm.querySelector('button');
    button.disabled = true;

    try {
        const data = await apiRequest('/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        await chrome.storage.local.set({ token: data.token });
        showLoggedInView(data.user);
    } catch (err) {
        displayMessage(err.message, true);
    } finally {
        button.disabled = false;
    }
}

async function handleLogout() {
    await chrome.storage.local.remove('token');
    showView('auth');
    // Ensure login form is visible after logout
    if (signupForm.classList.contains('hidden')) {
        return; // Already on login
    }
    toggleForms();
}

function showLoggedInView(user) {
    welcomeMessage.textContent = `Welcome, ${user.username}!`;
    showView('app');
}

/**
 * Checks if a user is already logged in when the popup is opened.
 */
async function checkAuthStatus() {
    showView('loading');
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
        showView('auth');
        return;
    }

    try {
        // Verify token with the backend
        const user = await apiRequest('/user', { method: 'GET' });
        showLoggedInView(user);
    } catch (err) {
        // Token is invalid or expired
        console.error('Token validation failed:', err.message);
        await chrome.storage.local.remove('token');
        showView('auth');
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', checkAuthStatus);
loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleSignup);
logoutBtn.addEventListener('click', handleLogout);
switchToSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms();
});
switchToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms();
});