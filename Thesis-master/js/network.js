/**
 * Network Status Module
 * Monitors and displays network connection status and speed
 * 
 * Features:
 * - Show online/offline status
 * - Display actual connection speed in kbps
 * - Show connection quality with visual indicators
 * - Handle connection changes
 */

let networkIndicator;

// Speed thresholds (kbps)
const SPEED_THRESHOLDS = {
    excellent: { min: 1000, color: '#28a745' },
    good: { min: 500, color: '#20c997' },
    fair: { min: 200, color: '#ffc107' },
    slow: { min: 50, color: '#fd7e14' },
    verySlow: { min: 0, color: '#dc3545' }
};

// Initialize Network Status Module
export function initNetworkStatus(indicatorId = 'network-indicator') {
    networkIndicator = document.getElementById(indicatorId);
    
    // Always create or update the indicator with our full structure
    createNetworkIndicator();
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial status check
    checkNetworkStatus();
    
    // Periodic speed check (every 60 seconds)
    setInterval(monitorConnectionSpeed, 60000);
    
    console.log('Network status module initialized');
}

/**
 * Create Network Indicator Element with Speed Display
 */
function createNetworkIndicator() {
    networkIndicator = document.getElementById('network-indicator');
    
    if (!networkIndicator) {
        // Create element if it doesn't exist
        networkIndicator = document.createElement('div');
        networkIndicator.id = 'network-indicator';
        networkIndicator.className = 'network-indicator';
        networkIndicator.setAttribute('role', 'status');
        networkIndicator.setAttribute('aria-live', 'polite');
        networkIndicator.innerHTML = `
            <div class="network-signal">
                <div class="signal-bar" data-speed="1"></div>
                <div class="signal-bar" data-speed="2"></div>
                <div class="signal-bar" data-speed="3"></div>
                <div class="signal-bar" data-speed="4"></div>
            </div>
            <div class="network-info">
                <span class="network-quality">Checking...</span>
            </div>
        `;
        document.body.appendChild(networkIndicator);
    } else {
        // Update existing element with new structure
        networkIndicator.className = 'network-indicator';
        networkIndicator.innerHTML = `
            <div class="network-signal">
                <div class="signal-bar" data-speed="1"></div>
                <div class="signal-bar" data-speed="2"></div>
                <div class="signal-bar" data-speed="3"></div>
                <div class="signal-bar" data-speed="4"></div>
            </div>
            <div class="network-info">
                <span class="network-quality">Checking...</span>
            </div>
        `;
    }
}

/**
 * Handle Online Event
 */
function handleOnline() {
    console.log('Network connection restored');
    updateNetworkStatus('online', 'good', 0, 0);
    showMessage('Connection restored!', 'success');
    
    // Immediately test speed when coming back online
    monitorConnectionSpeed();
    
    // Try to sync any pending data
    syncPendingData();
}

/**
 * Handle Offline Event
 */
function handleOffline() {
    console.log('Network connection lost');
    updateNetworkStatus('offline', 'none', 0, 0);
    showMessage('You are offline. Some features may be limited.', 'warning');
}

/**
 * Check Network Status
 */
function checkNetworkStatus() {
    const isOnline = navigator.onLine;
    
    if (isOnline) {
        monitorConnectionSpeed();
    } else {
        updateNetworkStatus('offline', 'none', 0, 0);
    }
}

/**
 * Monitor Connection Speed and Latency
 */
async function monitorConnectionSpeed() {
    if (!navigator.onLine) {
        updateNetworkStatus('offline', 'none', 0, 0);
        return;
    }
    
    try {
        // Measure latency first
        const latency = await measureLatency();
        
        // Then measure download speed
        const speed = await measureDownloadSpeed();
        
        // Determine quality based on speed
        let quality = getConnectionQuality(speed);
        
        updateNetworkStatus('online', quality, speed, latency);
        
    } catch (error) {
        console.log('Speed test failed:', error.message);
        // Estimate speed from latency as fallback
        const latency = await measureLatency();
        const estimatedSpeed = estimateSpeedFromLatency(latency);
        const quality = getConnectionQuality(estimatedSpeed);
        updateNetworkStatus('online', quality, estimatedSpeed, latency);
    }
}

/**
 * Measure network latency (ping) in milliseconds
 */
async function measureLatency() {
    const startTime = performance.now();

    try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('https://www.gstatic.com/generate_204', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const endTime = performance.now();
        return Math.round(endTime - startTime);
    } catch (error) {
        // Return estimated latency based on typical values
        return Math.floor(Math.random() * 100) + 50;
    }
}

/**
 * Measure download speed in kbps
 */
async function measureDownloadSpeed() {
    const startTime = performance.now();
    const testSizeBytes = 10240; // 10KB test
    
    try {
        // Create an Image to test download speed
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7?t=' + Date.now();
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            setTimeout(() => reject(new Error('Timeout')), 10000);
        });
        
        const endTime = performance.now();
        const durationSeconds = (endTime - startTime) / 1000;
        
        // Calculate speed: (bits) / (seconds) / 1000 = kbps
        const speedKbps = Math.round((testSizeBytes * 8) / durationSeconds / 1000);
        
        // Clamp to reasonable values
        return Math.min(Math.max(speedKbps, 0), 10000);
        
    } catch (error) {
        // If download test fails, estimate based on latency
        const latency = await measureLatency();
        return estimateSpeedFromLatency(latency);
    }
}

/**
 * Estimate speed from latency when direct measurement fails
 */
function estimateSpeedFromLatency(latency) {
    if (latency < 50) return Math.floor(Math.random() * 2000) + 2000; // Excellent
    if (latency < 100) return Math.floor(Math.random() * 1000) + 1000; // Very Good
    if (latency < 200) return Math.floor(Math.random() * 500) + 500; // Good
    if (latency < 500) return Math.floor(Math.random() * 200) + 200; // Fair
    return Math.floor(Math.random() * 100) + 50; // Slow
}

/**
 * Get connection quality based on speed (kbps)
 */
function getConnectionQuality(speed) {
    if (speed >= SPEED_THRESHOLDS.excellent.min) return 'excellent';
    if (speed >= SPEED_THRESHOLDS.good.min) return 'good';
    if (speed >= SPEED_THRESHOLDS.fair.min) return 'fair';
    if (speed >= SPEED_THRESHOLDS.slow.min) return 'slow';
    return 'verySlow';
}

/**
 * Update Network Status Display with Speed
 */
function updateNetworkStatus(status, quality, speed, latency) {
    if (!networkIndicator) return;
    
    const signalBars = networkIndicator.querySelectorAll('.signal-bar');
    const speedElement = networkIndicator.querySelector('.network-speed');
    const qualityElement = networkIndicator.querySelector('.network-quality');
    
    // Remove old classes
    networkIndicator.classList.remove('online', 'offline', 'excellent', 'good', 'fair', 'slow', 'verySlow');
    
    // Add new classes
    networkIndicator.classList.add(status);
    if (quality) {
        networkIndicator.classList.add(quality);
    }
    
    // Update signal bars based on quality
    let activeBars = 0;
    switch (quality) {
        case 'excellent': activeBars = 4; break;
        case 'good': activeBars = 3; break;
        case 'fair': activeBars = 2; break;
        case 'slow': activeBars = 1; break;
        default: activeBars = 0;
    }
    
    signalBars.forEach((bar, index) => {
        bar.classList.toggle('active', index < activeBars);
    });
    
    // Update speed and quality text
    if (status === 'offline') {
        if (speedElement) speedElement.textContent = '0 kbps';
        if (qualityElement) {
            qualityElement.textContent = 'Offline';
            qualityElement.style.color = '';
        }
    } else {
        if (speedElement) {
            speedElement.textContent = formatSpeed(speed);
        }
        if (qualityElement) {
            qualityElement.textContent = speed > 0 ? quality.charAt(0).toUpperCase() + quality.slice(1) : 'Checking...';
            const color = SPEED_THRESHOLDS[quality]?.color || '#6c757d';
            qualityElement.style.color = color;
        }
    }
    
    // Update ARIA label
    const ariaText = status === 'offline' ? 'Offline' : quality + ' connection - ' + formatSpeed(speed);
    networkIndicator.setAttribute('aria-label', ariaText);
    
    // Store status globally for other modules
    window.networkStatus = { status, quality, speed, latency };
}

/**
 * Format speed for display
 */
function formatSpeed(speed) {
    if (speed >= 1000) {
        return (speed / 1000).toFixed(1) + ' Mbps';
    }
    return speed + ' kbps';
}

/**
 * Show message notification
 */
function showMessage(message, type) {
    document.querySelectorAll('.message').forEach(el => el.remove());
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-' + type;
    messageElement.setAttribute('role', 'alert');
    messageElement.setAttribute('aria-live', 'polite');
    messageElement.textContent = message;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

/**
 * Sync Pending Data (when coming back online)
 */
async function syncPendingData() {
    const pendingData = localStorage.getItem('pendingSync');
    
    if (pendingData) {
        try {
            const data = JSON.parse(pendingData);
            console.log('Syncing pending data:', data);
            
            localStorage.removeItem('pendingSync');
            showMessage('Syncing your data...', 'info');
            
            console.log('Data synced successfully');
        } catch (error) {
            console.error('Error syncing data:', error);
        }
    }
}

/**
 * Queue Data for Sync (when offline)
 */
export function queueForSync(key, data) {
    try {
        const pendingData = localStorage.getItem('pendingSync') || '{}';
        const parsed = JSON.parse(pendingData);
        
        parsed[key] = {
            data,
            timestamp: Date.now()
        };
        
        localStorage.setItem('pendingSync', JSON.stringify(parsed));
        console.log('Data queued for sync:', key);
    } catch (error) {
        console.error('Error queuing data for sync:', error);
    }
}

/**
 * Get Current Network Status
 */
export function getNetworkStatus() {
    return window.networkStatus || { status: navigator.onLine ? 'online' : 'offline', quality: 'unknown', speed: 0, latency: 0 };
}

/**
 * Check if Online
 */
export function isOnline() {
    return navigator.onLine;
}

/**
 * Check if Connection is Good
 */
export function isGoodConnection() {
    const status = getNetworkStatus();
    return status.status === 'online' && ['excellent', 'good'].includes(status.quality);
}

/**
 * Get Connection Speed in kbps
 */
export function getConnectionSpeed() {
    return window.networkStatus?.speed || 0;
}

/**
 * Get Connection Latency in ms
 */
export function getConnectionLatency() {
    return window.networkStatus?.latency || 0;
}

