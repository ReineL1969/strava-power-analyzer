// power-metrics.js - Power metrics calculations

// Calculate Training Stress Score (TSS)
function calculateTSS(normalizedPower, durationSeconds, ftp) {
    const intensityFactor = normalizedPower / ftp;
    return (durationSeconds * normalizedPower * intensityFactor) / (ftp * 3600) * 100;
}

// Calculate Normalized Power (NP)
function calculateNormalizedPower(powerData) {
    if (!powerData || powerData.length === 0) return 0;
    
    // Step 1: Calculate 30-second moving average
    const windowSize = 30;
    const movingAvg = [];
    
    for (let i = 0; i <= powerData.length - windowSize; i++) {
        const window = powerData.slice(i, i + windowSize);
        const avg = window.reduce((sum, val) => sum + val, 0) / windowSize;
        movingAvg.push(avg);
    }
    
    // Step 2: Raise each value to the 4th power
    const fourthPower = movingAvg.map(val => Math.pow(val, 4));
    
    // Step 3: Calculate the average of the 4th power values
    const avgFourthPower = fourthPower.reduce((sum, val) => sum + val, 0) / fourthPower.length;
    
    // Step 4: Take the 4th root of the average
    return Math.pow(avgFourthPower, 0.25);
}

// Calculate Intensity Factor (IF)
function calculateIntensityFactor(normalizedPower, ftp) {
    return normalizedPower / ftp;
}

// Calculate Variability Index (VI)
function calculateVariabilityIndex(normalizedPower, averagePower) {
    return normalizedPower / averagePower;
}

// Define power zones based on FTP
function calculatePowerZones(ftp) {
    return [
        { zone: 1, name: "Active Recovery", from: 0, to: Math.floor(ftp * 0.55) },
        { zone: 2, name: "Endurance", from: Math.floor(ftp * 0.56), to: Math.floor(ftp * 0.75) },
        { zone: 3, name: "Tempo", from: Math.floor(ftp * 0.76), to: Math.floor(ftp * 0.90) },
        { zone: 4, name: "Threshold", from: Math.floor(ftp * 0.91), to: Math.floor(ftp * 1.05) },
        { zone: 5, name: "VO2 Max", from: Math.floor(ftp * 1.06), to: Math.floor(ftp * 1.20) },
        { zone: 6, name: "Anaerobic Capacity", from: Math.floor(ftp * 1.21), to: Math.floor(ftp * 1.50) },
        { zone: 7, name: "Neuromuscular Power", from: Math.floor(ftp * 1.51), to: 9999 }
    ];
}

// Calculate time spent in each power zone
function calculatePowerZoneDistribution(powerData, ftp) {
    const zones = calculatePowerZones(ftp);
    const distribution = zones.map(zone => ({
        zone: zone.zone,
        name: zone.name,
        timeSeconds: 0,
        percentage: 0
    }));
    
    // Count seconds in each zone
    powerData.forEach(power => {
        const zoneIndex = zones.findIndex(zone => power >= zone.from && power <= zone.to);
        if (zoneIndex !== -1) {
            distribution[zoneIndex].timeSeconds += 1; // Assuming 1 data point per second
        }
    });
    
    // Calculate percentages
    const totalSeconds = powerData.length;
    distribution.forEach(zone => {
        zone.percentage = (zone.timeSeconds / totalSeconds) * 100;
    });
    
    return distribution;
}

// Calculate Chronic Training Load (CTL)
function calculateCTL(dailyTSS, days = 42) {
    return calculateExponentialMovingAverage(dailyTSS, days);
}

// Calculate Acute Training Load (ATL)
function calculateATL(dailyTSS, days = 7) {
    return calculateExponentialMovingAverage(dailyTSS, days);
}

// Calculate Training Stress Balance (TSB)
function calculateTSB(ctl, atl) {
    return ctl.map((ctlValue, index) => ctlValue - atl[index]);
}

// Helper function to calculate exponential moving average
function calculateExponentialMovingAverage(values, days) {
    const alpha = 1 - Math.exp(-1 / days);
    const result = [];
    let ema = values[0];
    
    for (let i = 0; i < values.length; i++) {
        ema = alpha * values[i] + (1 - alpha) * (i > 0 ? result[i - 1] : values[0]);
        result.push(ema);
    }
    
    return result;
}

// Process activity data to calculate power metrics
function processActivityData(activity, streams, ftp) {
    // Default FTP if not provided
    ftp = ftp || 250;
    
    // If no power data, return basic metrics
    if (!streams || !streams.watts) {
        return {
            id: activity.id,
            name: activity.name,
            date: new Date(activity.start_date).toLocaleDateString(),
            type: activity.type,
            distance: activity.distance / 1000, // convert to km
            duration: activity.moving_time,
            durationFormatted: formatDuration(activity.moving_time),
            elevation: activity.total_elevation_gain,
            averagePower: activity.average_watts || 0,
            normalizedPower: 0,
            intensityFactor: 0,
            tss: 0,
            averageHeartRate: activity.average_heartrate || 0,
            maxHeartRate: activity.max_heartrate || 0,
            powerZones: []
        };
    }
    
    // Calculate normalized power
    const powerData = streams.watts.data;
    const normalizedPower = calculateNormalizedPower(powerData);
    const intensityFactor = calculateIntensityFactor(normalizedPower, ftp);
    const tss = calculateTSS(normalizedPower, activity.moving_time, ftp);
    const powerZones = calculatePowerZoneDistribution(powerData, ftp);
    
    return {
        id: activity.id,
        name: activity.name,
        date: new Date(activity.start_date).toLocaleDateString(),
        type: activity.type,
        distance: activity.distance / 1000, // convert to km
        duration: activity.moving_time,
        durationFormatted: formatDuration(activity.moving_time),
        elevation: activity.total_elevation_gain,
        averagePower: activity.average_watts || 0,
        normalizedPower: Math.round(normalizedPower),
        intensityFactor: intensityFactor.toFixed(2),
        tss: Math.round(tss),
        averageHeartRate: activity.average_heartrate || 0,
        maxHeartRate: activity.max_heartrate || 0,
        powerZones: powerZones
    };
}

// Format seconds to HH:MM:SS
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
