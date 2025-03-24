// api.js - Handles Strava API requests

// Fetch user's activities from Strava
async function fetchActivities(page = 1, perPage = 30) {
    const accessToken = localStorage.getItem('strava_access_token');
    
    if (!accessToken) {
        console.error('No access token available');
        return [];
    }
    
    try {
        const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }) ;
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const activities = await response.json();
        return activities;
    } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
    }
}

// Fetch detailed activity data
async function fetchActivityDetails(activityId) {
    const accessToken = localStorage.getItem('strava_access_token');
    
    if (!accessToken) {
        console.error('No access token available');
        return null;
    }
    
    try {
        const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=true`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }) ;
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const activity = await response.json();
        return activity;
    } catch (error) {
        console.error(`Error fetching activity ${activityId}:`, error);
        return null;
    }
}

// Fetch activity streams (time series data)
async function fetchActivityStreams(activityId) {
    const accessToken = localStorage.getItem('strava_access_token');
    
    if (!accessToken) {
        console.error('No access token available');
        return null;
    }
    
    try {
        const streamTypes = ['time', 'watts', 'heartrate', 'cadence', 'velocity_smooth', 'altitude'];
        const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}/streams?keys=${streamTypes.join(',') }&key_by_type=true`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const streams = await response.json();
        return streams;
    } catch (error) {
        console.error(`Error fetching streams for activity ${activityId}:`, error);
        return null;
    }
}

// Fetch athlete profile
async function fetchAthleteProfile() {
    const accessToken = localStorage.getItem('strava_access_token');
    
    if (!accessToken) {
        console.error('No access token available');
        return null;
    }
    
    try {
        const response = await fetch('https://www.strava.com/api/v3/athlete', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }) ;
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const athlete = await response.json();
        return athlete;
    } catch (error) {
        console.error('Error fetching athlete profile:', error);
        return null;
    }
}
