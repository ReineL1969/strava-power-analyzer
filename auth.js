// auth.js - Handles Strava OAuth authentication

// Strava API credentials - replace with your own from Step 1
const STRAVA_CLIENT_ID = '153121';
const STRAVA_CLIENT_SECRET = '37e7ec823166b91d9541a39de17f4dfd78fef781YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'https://[your-username].github.io/strava-power-analyzer/callback.html';

// Check if user is already authenticated
function checkAuth()  {
    const accessToken = localStorage.getItem('strava_access_token');
    const tokenExpiry = localStorage.getItem('strava_token_expires_at');
    
    if (accessToken && tokenExpiry) {
        // Check if token is expired
        if (Date.now() / 1000 > tokenExpiry) {
            // Token expired, refresh it
            refreshToken();
        } else {
            // Token valid, update UI
            updateUIForAuthenticatedUser();
            return true;
        }
    } else {
        // Not authenticated, update UI
        updateUIForUnauthenticatedUser();
        return false;
    }
}

// Initiate Strava OAuth flow
function initiateStravaAuth() {
    const scope = 'read,activity:read_all,profile:read_all';
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
}

// Handle OAuth callback and exchange code for token
async function handleAuthCallback()  {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        try {
            const response = await fetch('https://www.strava.com/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: STRAVA_CLIENT_ID,
                    client_secret: STRAVA_CLIENT_SECRET,
                    code: code,
                    grant_type: 'authorization_code'
                }) 
            });
            
            const data = await response.json();
            
            // Store tokens
            localStorage.setItem('strava_access_token', data.access_token);
            localStorage.setItem('strava_refresh_token', data.refresh_token);
            localStorage.setItem('strava_token_expires_at', data.expires_at);
            localStorage.setItem('strava_athlete', JSON.stringify(data.athlete));
            
            // Redirect to main page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error exchanging code for token:', error);
            document.getElementById('auth-error').textContent = 'Authentication failed. Please try again.';
        }
    }
}

// Refresh expired token
async function refreshToken() {
    const refreshToken = localStorage.getItem('strava_refresh_token');
    
    if (!refreshToken) {
        updateUIForUnauthenticatedUser();
        return;
    }
    
    try {
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            }) 
        });
        
        const data = await response.json();
        
        // Update stored tokens
        localStorage.setItem('strava_access_token', data.access_token);
        localStorage.setItem('strava_refresh_token', data.refresh_token);
        localStorage.setItem('strava_token_expires_at', data.expires_at);
        
        updateUIForAuthenticatedUser();
    } catch (error) {
        console.error('Error refreshing token:', error);
        updateUIForUnauthenticatedUser();
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    const authButton = document.getElementById('auth-button');
    const userInfo = document.getElementById('user-info');
    
    if (authButton) {
        authButton.textContent = 'Disconnect from Strava';
        authButton.onclick = logout;
    }
    
    if (userInfo) {
        const athlete = JSON.parse(localStorage.getItem('strava_athlete') || '{}');
        userInfo.innerHTML = `
            <div class="user-profile">
                <img src="${athlete.profile}" alt="${athlete.firstname}" class="profile-pic">
                <div>
                    <p>Connected as: ${athlete.firstname} ${athlete.lastname}</p>
                    <p class="text-sm">FTP: ${localStorage.getItem('user_ftp') || '250'} W</p>
                </div>
            </div>
        `;
    }
    
    // Show content that requires authentication
    document.querySelectorAll('.requires-auth').forEach(el => {
        el.style.display = 'block';
    });
    
    // Load user's activities
    loadActivities();
}

// Update UI for unauthenticated user
function updateUIForUnauthenticatedUser() {
    const authButton = document.getElementById('auth-button');
    const userInfo = document.getElementById('user-info');
    
    if (authButton) {
        authButton.textContent = 'Connect with Strava';
        authButton.onclick = initiateStravaAuth;
    }
    
    if (userInfo) {
        userInfo.innerHTML = '<p>Not connected to Strava</p>';
    }
    
    // Hide content that requires authentication
    document.querySelectorAll('.requires-auth').forEach(el => {
        el.style.display = 'none';
    });
}

// Logout function
function logout() {
    localStorage.removeItem('strava_access_token');
    localStorage.removeItem('strava_refresh_token');
    localStorage.removeItem('strava_token_expires_at');
    localStorage.removeItem('strava_athlete');
    
    updateUIForUnauthenticatedUser();
}
