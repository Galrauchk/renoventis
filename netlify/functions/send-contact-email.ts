interface ContactPayload {
  type: 'devis' | 'contact';
  nom?: string;
  email?: string;
  telephone?: string;
  code_postal?: string;
  travaux?: string | string[];
  type_logement?: string;
  surface?: string;
  annee_construction?: string;
  dpe_actuel?: string;
  revenus?: string;
  sujet?: string;
  message?: string;
  website?: string; // honeypot field
}

// Simple in-memory rate limiter (per function instance)
const rateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimit.get(ip) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimit.set(ip, recent);
  return false;
}

// Validation helpers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[\d\s+()./-]{6,20}$/;
const CP_RE = /^\d{5}$/;

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) : str;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-nf-client-connection-ip')
    || 'unknown';
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jeffrey.aldebert@gmail.com';
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
  }

  // Parse body with size guard
  let rawText: string;
  try {
    rawText = await req.text();
    if (rawText.length > 50_000) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }

  let body: ContactPayload;
  try {
    body = JSON.parse(rawText) as ContactPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  // Honeypot check — bots fill hidden fields
  if (body.website) {
    // Silently accept to not reveal the trap, but don't send email
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  const { type, nom, email } = body;

  // Required fields
  if (!nom || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  // Validate email format
  if (!EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email format' }), { status: 400 });
  }

  // Validate phone if provided
  if (body.telephone && !PHONE_RE.test(body.telephone)) {
    return new Response(JSON.stringify({ error: 'Invalid phone format' }), { status: 400 });
  }

  // Validate code postal if provided
  if (body.code_postal && !CP_RE.test(body.code_postal)) {
    return new Response(JSON.stringify({ error: 'Invalid postal code' }), { status: 400 });
  }

  // Truncate fields to prevent abuse
  const safeName = truncate(nom, 255);
  const safeEmail = truncate(email, 255);
  const safePhone = truncate(body.telephone || '', 20);
  const safeCP = truncate(body.code_postal || '', 5);
  const safeSujet = truncate(body.sujet || '', 255);
  const safeMessage = truncate(body.message || '', 5000);

  let subject: string;
  let htmlContent: string;

  if (type === 'devis') {
    const travauxStr = Array.isArray(body.travaux)
      ? body.travaux.map(t => truncate(t, 100)).slice(0, 20).join(', ')
      : truncate(body.travaux || 'Non précisé', 500);
    subject = `[Renoventis] Demande devis — ${travauxStr} — ${safeCP || 'CP non précisé'}`;
    htmlContent = `
      <h2>Nouvelle demande de devis</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nom</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(safeName)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(safeEmail)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Téléphone</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(safePhone)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Code postal</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(safeCP)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Travaux</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(travauxStr)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Type logement</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(truncate(body.type_logement || 'Non précisé', 100))}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Surface</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(truncate(body.surface || 'Non précisé', 20))} m²</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Année construction</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(truncate(body.annee_construction || 'Non précisé', 20))}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">DPE actuel</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(truncate(body.dpe_actuel || 'Non précisé', 5))}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Revenus</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(truncate(body.revenus || 'Non précisé', 50))}</td></tr>
      </table>
    `;
  } else {
    subject = `[Renoventis] Contact — ${safeSujet || 'Message'}`;
    htmlContent = `
      <h2>Nouveau message de contact</h2>
      <p><strong>Nom :</strong> ${escapeHtml(safeName)}</p>
      <p><strong>Email :</strong> ${escapeHtml(safeEmail)}</p>
      <p><strong>Sujet :</strong> ${escapeHtml(safeSujet)}</p>
      <p><strong>Message :</strong></p>
      <p>${escapeHtml(safeMessage).replace(/\n/g, '<br>')}</p>
    `;
  }

  try {
    // Send notification to admin
    await sendBrevoEmail(BREVO_API_KEY, {
      sender: { name: 'Renoventis', email: 'contact@renoventis.fr' },
      to: [{ email: ADMIN_EMAIL, name: 'Renoventis' }],
      subject,
      htmlContent,
    });

    // Send confirmation to visitor
    await sendBrevoEmail(BREVO_API_KEY, {
      sender: { name: 'Renoventis', email: 'contact@renoventis.fr' },
      to: [{ email: safeEmail, name: safeName }],
      subject: type === 'devis'
        ? 'Renoventis — Votre demande de devis a bien été reçue'
        : 'Renoventis — Votre message a bien été reçu',
      htmlContent: type === 'devis'
        ? `<p>Bonjour ${escapeHtml(safeName)},</p><p>Nous avons bien reçu votre demande de devis. Des artisans RGE certifiés de votre région vous contacteront sous 48h avec leurs propositions.</p><p>Cordialement,<br>L'équipe Renoventis</p>`
        : `<p>Bonjour ${escapeHtml(safeName)},</p><p>Nous avons bien reçu votre message et vous répondrons dans les meilleurs délais.</p><p>Cordialement,<br>L'équipe Renoventis</p>`,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: unknown) {
    console.error('Brevo API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendBrevoEmail(apiKey: string, payload: {
  sender: { name: string; email: string };
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
}): Promise<void> {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brevo API error: ${response.status} ${text}`);
  }
}
