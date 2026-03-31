/**
 * Vercel Serverless: POST /api/cloudinary-proxy?action=search|delete
 * Variabili ambiente: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * Opzionale: ADMIN_API_KEY — se impostata, richiede header x-admin-api-key uguale (protezione abuse)
 */

const ALLOWED_ORIGIN = process.env.ADMIN_CORS_ORIGIN || '*';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-api-key');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function getJsonBody(req) {
  const b = req.body;
  if (b == null) return {};
  if (typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  if (typeof b === 'string') {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const adminKey = process.env.ADMIN_API_KEY;
  if (adminKey && req.headers['x-admin-api-key'] !== adminKey) {
    return res.status(401).json({ error: { message: 'Non autorizzato (API admin).' } });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({
      error: { message: 'Server: mancano CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET' }
    });
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const action = req.query?.action;
  const payload = getJsonBody(req);

  if (req.method !== 'POST' || !action) {
    return res.status(405).json({ error: { message: 'Usa POST con ?action=search o ?action=delete' } });
  }

  try {
    if (action === 'search') {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    if (action === 'delete') {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    return res.status(400).json({ error: { message: 'action non valida' } });
  } catch (err) {
    console.error('cloudinary-proxy', err);
    return res.status(502).json({ error: { message: err.message || 'Errore proxy' } });
  }
}
