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
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
  }

  let body: ContactPayload;
  try {
    body = await req.json() as ContactPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { type, nom, email } = body;

  if (!nom || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  let subject: string;
  let htmlContent: string;

  if (type === 'devis') {
    const travauxStr = Array.isArray(body.travaux) ? body.travaux.join(', ') : (body.travaux || 'Non précisé');
    subject = `[Renoventis] Demande devis — ${travauxStr} — ${body.code_postal || 'CP non précisé'}`;
    htmlContent = `
      <h2>Nouvelle demande de devis</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nom</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(nom)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Téléphone</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(body.telephone || '')}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Code postal</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(body.code_postal || '')}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Travaux</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(travauxStr)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Type logement</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(body.type_logement || 'Non précisé')}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Surface</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(body.surface || 'Non précisé')} m²</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Année construction</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(body.annee_construction || 'Non précisé')}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">DPE actuel</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(body.dpe_actuel || 'Non précisé')}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Revenus</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(body.revenus || 'Non précisé')}</td></tr>
      </table>
    `;
  } else {
    subject = `[Renoventis] Contact — ${body.sujet || 'Message'}`;
    htmlContent = `
      <h2>Nouveau message de contact</h2>
      <p><strong>Nom :</strong> ${escapeHtml(nom)}</p>
      <p><strong>Email :</strong> ${escapeHtml(email)}</p>
      <p><strong>Sujet :</strong> ${escapeHtml(body.sujet || '')}</p>
      <p><strong>Message :</strong></p>
      <p>${escapeHtml(body.message || '').replace(/\n/g, '<br>')}</p>
    `;
  }

  try {
    // Send notification to admin
    await sendBrevoEmail(BREVO_API_KEY, {
      sender: { name: 'Renoventis', email: 'contact@renoventis.fr' },
      to: [{ email: 'jeffrey.aldebert@gmail.com', name: 'Renoventis' }],
      subject,
      htmlContent,
    });

    // Send confirmation to visitor
    await sendBrevoEmail(BREVO_API_KEY, {
      sender: { name: 'Renoventis', email: 'contact@renoventis.fr' },
      to: [{ email, name: nom }],
      subject: type === 'devis'
        ? 'Renoventis — Votre demande de devis a bien été reçue'
        : 'Renoventis — Votre message a bien été reçu',
      htmlContent: type === 'devis'
        ? `<p>Bonjour ${escapeHtml(nom)},</p><p>Nous avons bien reçu votre demande de devis. Des artisans RGE certifiés de votre région vous contacteront sous 48h avec leurs propositions.</p><p>Cordialement,<br>L'équipe Renoventis</p>`
        : `<p>Bonjour ${escapeHtml(nom)},</p><p>Nous avons bien reçu votre message et vous répondrons dans les meilleurs délais.</p><p>Cordialement,<br>L'équipe Renoventis</p>`,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
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
