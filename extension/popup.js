// --- CONFIGURATION ---
const API_BASE_URL = 'http://localhost:5000/api';

// --- DOM ELEMENT REFERENCES ---
// Views
const views = document.querySelectorAll('.view');
const loadingSpinner = document.getElementById('loading-spinner');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const friendsContainer = document.getElementById('friends-container');
const contentViewerContainer = document.getElementById('content-viewer-container');

// Auth
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const formTitle = document.getElementById('form-title');
const messageArea = document.getElementById('message-area');
const switchToRegisterLink = document.getElementById('switch-to-register');
const switchToLoginLink = document.getElementById('switch-to-login');

// App
const welcomeMessage = document.getElementById('welcome-message');
const manageFriendsBtn = document.getElementById('manage-friends-btn');
const logoutBtn = document.getElementById('logout-btn');
const backToAppBtn = document.getElementById('back-to-app-btn');

// Friends
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-username');
const searchResults = document.getElementById('search-results');
const incomingRequestsList = document.getElementById('incoming-requests-list');
const sentRequestsList = document.getElementById('sent-requests-list');
const friendsList = document.getElementById('friends-list');

// Content Viewer
const backToFriendsBtn = document.getElementById('back-to-friends-btn');
const contentViewerTitle = document.getElementById('content-viewer-title');
const friendContentList = document.getElementById('friend-content-list');
const friendsMessageArea = document.getElementById('friends-message-area');


// --- VIEW MANAGEMENT ---
function showView(viewId) {
    loadingSpinner.classList.add('hidden');
    views.forEach(view => view.classList.add('hidden'));
    if (viewId) {
        document.getElementById(viewId).classList.remove('hidden');
    } else {
        loadingSpinner.classList.remove('hidden');
    }
}

// --- DEBOUNCE HELPER ---
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// --- API HELPER ---
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
    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(responseData.error || 'An unknown server error occurred.');
    }
    return responseData;
}

// --- MESSAGE DISPLAY ---
function displayMessage(text, isError = false) {
    messageArea.textContent = text;
    messageArea.className = isError ? 'error' : 'success';
}
function hideMessage() { messageArea.className = ''; messageArea.textContent = ''; }

function displayFriendsMessage(text, isError = false) {
    friendsMessageArea.textContent = text;
    friendsMessageArea.className = isError ? 'error' : 'success';
}

function hideFriendsMessage() {
    friendsMessageArea.className = '';
    friendsMessageArea.textContent = '';
}

// --- RENDER FUNCTIONS ---
function renderList(container, items, renderItemFunc, placeholderText) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
        container.innerHTML = `<div class="list-placeholder">${placeholderText}</div>`;
        return;
    }
    items.forEach(item => {
        const itemEl = renderItemFunc(item);
        if (itemEl) container.appendChild(itemEl);
    });
}

function createListItem(contentHtml) {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = contentHtml;
    return div;
}

function renderSearchResults(users) {
    renderList(searchResults, users, (user) => createListItem(`
        <div class="list-item-content">
            <span class="username">${user.username}</span>
            <span class="displayName">${user.displayName}</span>
        </div>
        <div class="actions">
            <button class="btn btn-small btn-success add-friend-btn" data-username="${user.username}">Add</button>
        </div>
    `), 'No users found.');
}

function renderFriendsList(friends) {
    renderList(friendsList, friends, (friend) => createListItem(`
        <div class="list-item-content">
            <span class="username">${friend.username}</span>
            <span class="displayName">${friend.displayName}</span>
        </div>
        <div class="actions">
            <button class="btn btn-small btn-primary view-data-btn" data-username="${friend.username}">View</button>
            <button class="btn btn-small btn-danger remove-friend-btn" data-id="${friend._id}">Remove</button>
        </div>
    `), 'You have no friends yet.');
}

function renderIncomingRequests(requests) {
    renderList(incomingRequestsList, requests, (req) => createListItem(`
        <div class="list-item-content">
            <span class="username">${req.username}</span>
            <span class="displayName">${req.displayName}</span>
        </div>
        <div class="actions">
            <button class="btn btn-small btn-success accept-request-btn" data-id="${req.id}">Accept</button>
            <button class="btn btn-small btn-danger reject-request-btn" data-id="${req.id}">Reject</button>
        </div>
    `), 'No incoming requests.');
}

function renderSentRequests(requests) {
    renderList(sentRequestsList, requests, (req) => createListItem(`
        <div class="list-item-content">
            <span class="username">${req.username}</span>
            <span class="displayName">${req.displayName}</span>
        </div>
        <div class="actions">
            <button class="btn btn-small btn-secondary cancel-request-btn" data-id="${req.id}">Cancel</button>
        </div>
    `), 'No pending sent requests.');
}

function renderFriendContent(contentItems) {
    renderList(friendContentList, contentItems, (item) => {
        const div = document.createElement('div');
        div.className = 'content-item';
        div.innerHTML = `
            <div class="content-item-title">${item.title}</div>
            <p class="content-item-summary">${item.summary}</p>
            <a href="${item.originalUrl}" target="_blank" class="content-item-url">${item.domain}</a>
        `;
        return div;
    }, 'This friend has no public content.');
}

// --- ASYNC LOGIC & HANDLERS ---
// Auth
async function handleLogin(e) {
    e.preventDefault();
    const button = e.target.querySelector('button');
    button.disabled = true;
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                login: document.getElementById('login-input').value,
                password: document.getElementById('login-password').value,
            }),
        });
        await chrome.storage.local.set({ token: data.token, user: data.user });
        showLoggedInView(data.user);
    } catch (err) {
        displayMessage(err.message, true);
    } finally {
        button.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const button = e.target.querySelector('button');
    button.disabled = true;
    try {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                username: document.getElementById('register-username').value,
                email: document.getElementById('register-email').value,
                displayName: document.getElementById('register-displayName').value,
                password: document.getElementById('register-password').value,
            }),
        });
        await chrome.storage.local.set({ token: data.token, user: data.user });
        showLoggedInView(data.user);
    } catch (err) {
        displayMessage(err.message, true);
    } finally {
        button.disabled = false;
    }
}

async function handleLogout() {
    await chrome.storage.local.remove(['token', 'user']);
    showView('auth-container');
}

// Friends
async function handleLiveSearch() {
    hideFriendsMessage();
    const query = searchInput.value.trim();

    if (!query) {
        searchResults.innerHTML = ''; // Clear results
        searchResults.classList.add('hidden'); // Hide the container
        return;
    }

    // Make the container visible right before searching
    searchResults.classList.remove('hidden');
    searchResults.innerHTML = `<div class="list-placeholder">Searching...</div>`;

    try {
        const data = await apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
        renderSearchResults(data.users);
    } catch (err) {
        console.error("Search failed:", err.message);
        searchResults.innerHTML = `<div class="list-placeholder">Error searching.</div>`;
    }
}

async function fetchAllFriendData() {
    try {
        const [friends, incoming, sent] = await Promise.all([
            apiRequest('/friends/list'),
            apiRequest('/friends/requests'),
            apiRequest('/friends/sent-requests')
        ]);
        renderFriendsList(friends.friends);
        renderIncomingRequests(incoming.pending);
        renderSentRequests(sent.sent);
    } catch (err) {
        console.error("Failed to fetch friend data:", err.message);
    }
}

async function handleViewFriendData(username) {
    contentViewerTitle.textContent = `${username}'s Content`;
    showView('content-viewer-container');
    renderFriendContent([]); // show loading state
    try {
        const { content } = await apiRequest(`/content/user/${username}`);
        renderFriendContent(content);
    } catch (err) {
        console.error("Failed to fetch friend data", err);
        renderFriendContent(null);
    }
}

// --- UI INITIALIZATION & State ---
function showLoggedInView(user) {
    welcomeMessage.textContent = `Welcome, ${user.displayName || user.username}!`;
    showView('app-container');
}

function toggleAuthForms() {
    hideMessage();
    const isLoginVisible = !loginForm.classList.contains('hidden');
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
    switchToLoginLink.classList.toggle('hidden');
    switchToRegisterLink.classList.toggle('hidden');
    formTitle.textContent = isLoginVisible ? 'Register' : 'Login';
}

async function checkAuthStatus() {
    showView(null); // Show loading spinner
    const { token, user } = await chrome.storage.local.get(['token', 'user']);
    if (token && user) {
        // Optional: Add a call to a /me endpoint to verify token is still valid
        showLoggedInView(user);
    } else {
        showView('auth-container');
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// Auth
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
logoutBtn.addEventListener('click', handleLogout);
switchToRegisterLink.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(); });
switchToLoginLink.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(); });

// View Switching
manageFriendsBtn.addEventListener('click', () => {
    fetchAllFriendData();
    showView('friends-container');
});
backToAppBtn.addEventListener('click', () => {
    // Reset the search state when leaving the friends page
    hideFriendsMessage();
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchResults.classList.add('hidden');

    // Go back to the main app view
    showView('app-container');
});
backToFriendsBtn.addEventListener('click', () => showView('friends-container'));

// Friend Actions (using event delegation)
searchInput.addEventListener('input', debounce(handleLiveSearch, 300));

document.body.addEventListener('click', async (e) => {
    hideFriendsMessage();

    const target = e.target;
    let needsFullRefresh = false;

    try {
        if (target.matches('.add-friend-btn')) {
            target.disabled = true;
            target.textContent = '...';
            await apiRequest('/friends/request', { method: 'POST', body: JSON.stringify({ toUsername: target.dataset.username }) });
            needsFullRefresh = true;

        } else if (target.matches('.accept-request-btn')) {
            await apiRequest('/friends/accept', { method: 'POST', body: JSON.stringify({ fromId: target.dataset.id }) });
            needsFullRefresh = true;

        } else if (target.matches('.reject-request-btn')) {
            await apiRequest('/friends/reject', { method: 'POST', body: JSON.stringify({ fromId: target.dataset.id }) });
            needsFullRefresh = true;

        } else if (target.matches('.cancel-request-btn')) {
            await apiRequest('/friends/cancel', { method: 'POST', body: JSON.stringify({ toId: target.dataset.id }) });
            needsFullRefresh = true;

        } else if (target.matches('.view-data-btn')) {
            handleViewFriendData(target.dataset.username);

        // --- NEW INLINE CONFIRMATION LOGIC (REPLACES confirm()) ---

        } else if (target.matches('.remove-friend-btn')) {
            // STEP 1: Show the confirmation buttons
            const actionsDiv = target.closest('.actions');
            const friendId = target.dataset.id;
            actionsDiv.innerHTML = `
                <button class="btn btn-small btn-danger confirm-remove-btn" data-id="${friendId}">Confirm</button>
                <button class="btn btn-small btn-secondary cancel-remove-btn" data-id="${friendId}">Cancel</button>
            `;

        } else if (target.matches('.cancel-remove-btn')) {
            // STEP 2A: Revert back to the original state if canceled
            const actionsDiv = target.closest('.actions');
            const listItem = target.closest('.list-item');
            const friendId = target.dataset.id;
            const friendUsername = listItem.querySelector('.username').textContent;
            
            actionsDiv.innerHTML = `
                <button class="btn btn-small btn-primary view-data-btn" data-username="${friendUsername}">View</button>
                <button class="btn btn-small btn-danger remove-friend-btn" data-id="${friendId}">Remove</button>
            `;

        } else if (target.matches('.confirm-remove-btn')) {
            // STEP 2B: Perform the removal if confirmed
            const actionsDiv = target.closest('.actions');
            const listItem = target.closest('.list-item');
            const friendId = target.dataset.id;
            const friendUsername = listItem.querySelector('.username').textContent;

            // Give feedback
            target.disabled = true;
            target.textContent = '...';

            // Call the API
            await apiRequest('/friends/remove', { method: 'POST', body: JSON.stringify({ friendId }) });

            // Optimistically update the UI to the "Add" state
            actionsDiv.innerHTML = `<button class="btn btn-small btn-success add-friend-btn" data-username="${friendUsername}">Add</button>`;
        }
        
        // --- Perform Full Refresh if an action required it ---
        if (needsFullRefresh) {
            await fetchAllFriendData();
        }

    } catch (err) {
        displayFriendsMessage(err.message, true); // Use the non-blocking error display
        if (needsFullRefresh) {
            await fetchAllFriendData();
        }
    }
});