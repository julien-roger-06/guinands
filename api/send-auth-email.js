import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, email_data } = req.body;

  const to = user?.email;
  const token_hash = email_data?.token_hash;
  const redirect_to = email_data?.redirect_to || '';
  const email_type = email_data?.email_type || 'magiclink';

  if (!to || !token_hash) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  const baseUrl = process.env.VITE_SUPABASE_URL;
  const confirmUrl = `${baseUrl}/auth/v1/verify?token_hash=${token_hash}&type=${email_type}${redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : ''}`;

  let subject, html;

  if (email_type === 'magiclink' || email_type === 'otp') {
    subject = 'Votre lien de connexion — Procurations Allos';
    html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #c2410c;">Connexion à Procurations Allos</h2>
        <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>
        <p style="margin: 24px 0;">
          <a href="${confirmUrl}"
             style="background: linear-gradient(135deg, #ea580c, #c2410c); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Se connecter
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Ce lien est valable 1 heure. Si vous n'avez pas demandé cette connexion, ignorez cet email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Le Seignus Renaissance — Initiative citoyenne pour Allos</p>
      </div>
    `;
  } else if (email_type === 'signup') {
    subject = 'Confirmez votre inscription — Procurations Allos';
    html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #c2410c;">Confirmez votre inscription</h2>
        <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email :</p>
        <p style="margin: 24px 0;">
          <a href="${confirmUrl}"
             style="background: linear-gradient(135deg, #ea580c, #c2410c); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Confirmer mon inscription
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Le Seignus Renaissance — Initiative citoyenne pour Allos</p>
      </div>
    `;
  } else {
    subject = 'Action requise — Procurations Allos';
    html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <p><a href="${confirmUrl}">Cliquez ici pour continuer</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Le Seignus Renaissance — Initiative citoyenne pour Allos</p>
      </div>
    `;
  }

  try {
    await resend.emails.send({
      from: 'Le Seignus Renaissance <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur envoi email auth:', error);
    res.status(500).json({ error: error.message });
  }
}
