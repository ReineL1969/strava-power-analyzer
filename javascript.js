// Load activities from Strava
async function loadActivities() {
    const activities = await fetchActivities();
    if (activities.length === 0) return;
    
    // Process activities to calculate power metrics
    const ftp = localStorage.getItem('user_ftp') || 250;
    const processedActivities = [];
    
    // Process first 5 activities in detail
    for (let i = 0; i < Math.min(5, activities.length); i++) {
        const activity = activities[i];
        if (activity.type === 'Ride' && activity.average_watts) {
            const streams = await fetchActivityStreams(activity.id);
            const processedActivity = processActivityData(activity, streams, ftp);
            processedActivities.push(processedActivity);
        }
    }
    
    // Update recent activities table
    updateRecentActivitiesTable(processedActivities);
    
    // Calculate fitness metrics
    calculateFitnessMetrics(activities);
}

// Update recent activities table with real data
function updateRecentActivitiesTable(activities) {
    const tableBody = document.querySelector('#recent-activities-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    activities.forEach(activity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activity.date}</td>
            <td>${activity.name}</td>
            <td>${activity.tss}</td>
            <td>${activity.normalizedPower}</td>
            <td>${activity.intensityFactor}</td>
            <td>${activity.durationFormatted}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Calculate fitness metrics from activities
function calculateFitnessMetrics(activities) {
    // Sort activities by date
    activities.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    // Get daily TSS for the last 90 days
    const today = new Date();
    const dailyTSS = [];
    
    for (let i = 90; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        // Find activities on this date
        const dayActivities = activities.filter(activity => {
            const activityDate = new Date(activity.start_date);
            activityDate.setHours(0, 0, 0, 0);
            return activityDate.getTime() === date.getTime();
        });
        
        // Calculate total TSS for the day
        let dayTSS = 0;
        dayActivities.forEach(activity => {
            if (activity.type === 'Ride' && activity.average_watts) {
                const ftp = localStorage.getItem('user_ftp') || 250;
                const normalizedPower = activity.average_watts * 1.05; // Estimate NP if not available
                const tss = calculateTSS(normalizedPower, activity.moving_time, ftp);
                dayTSS += tss;
            }
        });
        
        dailyTSS.push(dayTSS);
    }
    
    // Calculate CTL, ATL, and TSB
    const ctl = calculateCTL(dailyTSS);
    const atl = calculateATL(dailyTSS);
    const tsb = calculateTSB(ctl, atl);
    
    // Update fitness metrics display
    updateFitnessMetricsDisplay(ctl, atl, tsb);
}

// Update fitness metrics display
function updateFitnessMetricsDisplay(ctl, atl, tsb) {
    // Update current metrics
    document.getElementById('current-ctl').textContent = Math.round(ctl[ctl.length - 1]);
    document.getElementById('current-atl').textContent = Math.round(atl[atl.length - 1]);
    document.getElementById('current-tsb').textContent = Math.round(tsb[tsb.length - 1]);
    
    // Update charts with real data
    updateFitnessChart(ctl, atl, tsb);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    checkAuth();
});
