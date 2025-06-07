document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('qr-video');
    const canvas = document.getElementById('qr-canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const scanResult = document.getElementById('scan-result');
    const userEmail = document.getElementById('user-email');
    const startButton = document.getElementById('start-button');
    
    let scanning = false;
    let stream = null;

    // IndexedDB Configuration
    const DB_NAME = 'gymScannerDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'pendingScans';
    let db;

    // Initialize IndexedDB
    async function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                }
            };
        });
    }

    // Save scan to IndexedDB when offline
    async function saveScanOffline(email) {
        if (!db) await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const scan = {
                email,
                timestamp: new Date().toISOString(),
                status: 'pending',
                retryCount: 0
            };
            
            const request = store.add(scan);
            
            request.onsuccess = () => {
                console.log('Scan saved offline');
                resolve();
            };
            
            request.onerror = (event) => {
                console.error('Error saving offline scan:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Get all pending scans from IndexedDB
    async function getPendingScans() {
        if (!db) await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error('Error getting pending scans:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Delete a scan from IndexedDB after successful sync
    async function deleteScan(id) {
        if (!db) await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = (event) => {
                console.error('Error deleting scan:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Update scan in IndexedDB (for retry count)
    async function updateScan(scan) {
        if (!db) await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(scan);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = (event) => {
                console.error('Error updating scan:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Set canvas size
    function setCanvasSize() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    // Process QR code
    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            setCanvasSize();
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                try {
                    const userData = JSON.parse(code.data);
                    if (userData.email) {
                        scanResult.textContent = 'QR Code Scanned Successfully!';
                        userEmail.textContent = `User: ${userData.email}`;
                        
                        // Send data to server to update attendance
                        updateAttendance(userData.email);
                        
                        // Stop scanning after successful scan
                        stopScanning();
                    }
                } catch (e) {
                    scanResult.textContent = 'Invalid QR Code Format';
                    userEmail.textContent = '';
                }
            }
        }

        if (scanning) {
            requestAnimationFrame(tick);
        }
    }

    // Start scanning
    async function startScanning() {
        try {
            // First check if we already have permission
            const permissions = await navigator.permissions.query({ name: 'camera' });
            if (permissions.state === 'denied') {
                scanResult.textContent = 'Camera permission denied. Please enable it in browser settings.';
                return;
            }

            // Request camera access
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Set up video element
            video.srcObject = stream;
            video.setAttribute('playsinline', 'true'); // Required for iOS
            await video.play();
            
            scanning = true;
            startButton.textContent = 'Stop Scanner';
            scanResult.textContent = 'Scanning...';
            userEmail.textContent = '';
            tick();
        } catch (err) {
            console.error('Error accessing camera:', err);
            let errorMessage = 'Could not access camera.';
            
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera permission denied. Please allow camera access.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera found.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'Camera is already in use.';
            }
            
            scanResult.textContent = errorMessage;
        }
    }

    // Stop scanning
    function stopScanning() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        scanning = false;
        startButton.textContent = 'Start Scanner';
    }

    // Toggle scanner
    startButton.addEventListener('click', () => {
        if (scanning) {
            stopScanning();
        } else {
            startScanning();
        }
    });

    // Update attendance with offline support
    async function updateAttendance(email) {
        try {
            // First check if we're online
            if (!navigator.onLine) {
                await saveScanOffline(email);
                scanResult.textContent = 'Scan saved offline. Will sync when connection is restored.';
                return;
            }
            
            const response = await fetch('/api/qrScanning/update-attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            // Check content type before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Expected JSON but got: ${text.substring(0, 100)}`);
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Server returned error');
            }
            
            scanResult.textContent = 'Attendance updated successfully!';
        } catch (error) {
            console.error('Error updating attendance:', error);
            
            // Save to offline storage if network request failed
            await saveScanOffline(email);
            scanResult.textContent = 'Network error. Scan saved offline.';
            
            // Request background sync if available
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('sync-pending-scans');
                    console.log('Background sync registered');
                } catch (syncError) {
                    console.error('Background sync registration failed:', syncError);
                }
            }
        }
    }

    // Sync all pending scans with the server
    async function syncPendingScans() {
        try {
            const pendingScans = await getPendingScans();
            
            if (pendingScans.length === 0) return;
            
            console.log(`Found ${pendingScans.length} pending scans to sync`);
            scanResult.textContent = `Syncing ${pendingScans.length} pending scans...`;
            
            for (const scan of pendingScans) {
                try {
                    // Skip if we've retried too many times
                    if (scan.retryCount >= 5) {
                        console.log(`Skipping scan for ${scan.email} - max retries reached`);
                        await deleteScan(scan.id);
                        continue;
                    }
                    
                    const response = await fetch('/api/qrScanning/update-attendance', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: scan.email }),
                    });
                    
                    if (!response.ok) {
                        throw new Error('Server error');
                    }
                    
                    // Delete from IndexedDB if successful
                    await deleteScan(scan.id);
                    console.log(`Successfully synced scan for ${scan.email}`);
                } catch (error) {
                    console.error(`Failed to sync scan for ${scan.email}:`, error);
                    
                    // Update retry count
                    scan.retryCount = (scan.retryCount || 0) + 1;
                    await updateScan(scan);
                }
            }
            
            const remainingScans = await getPendingScans();
            if (remainingScans.length === 0) {
                scanResult.textContent = 'All pending scans synced successfully!';
            } else {
                scanResult.textContent = `Synced ${pendingScans.length - remainingScans.length} scans. ${remainingScans.length} failed.`;
            }
        } catch (error) {
            console.error('Error syncing pending scans:', error);
            scanResult.textContent = 'Error syncing pending scans. Will try again later.';
        }
    }

    // Check connectivity and sync if online
    async function checkConnectivityAndSync() {
        if (navigator.onLine) {
            await syncPendingScans();
        }
    }

    // Initialize database and check for pending scans
    await initDB();
    await checkConnectivityAndSync();
    
    // Listen for connectivity changes
    window.addEventListener('online', checkConnectivityAndSync);

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/scan/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    
                    // Check for updates periodically
                    setInterval(() => {
                        registration.update().then(() => {
                            console.log('Checked for service worker update');
                        });
                    }, 60 * 60 * 1000); // Check every hour
                })
                .catch(err => {
                    console.error('ServiceWorker registration failed: ', err);
                });
        });
    }
});