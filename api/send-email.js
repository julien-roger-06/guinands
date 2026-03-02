import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { mandataire, mandant } = req.body;

  try {
    // Email au mandataire
    await resend.emails.send({
      from: 'Guinands <noreply@votre-domaine.fr>',
      to: mandataire.email,
      subject: '🤝 Mise en relation — Procuration Allos',
      html: `
        <h2>Bonjour ${mandataire.prenom},</h2>
        <p><strong>${mandant.prenom} ${mandant.nom}</strong> souhaite vous confier sa procuration.</p>
        <p>📧 Email : ${mandant.email}</p>
        ${mandant.tel ? `<p>📱 Tél : ${mandant.tel}</p>` : ''}
        <p>📅 Tour(s) : ${mandant.tours}</p>
        <hr/>
        <p>Prenez contact pour organiser la procuration sur
        <a href="https://maprocuration.gouv.fr">maprocuration.gouv.fr</a>.</p>
      `
    });

    // Email au mandant
    await resend.emails.send({
      from: 'Guinands <noreply@votre-domaine.fr>',
      to: mandant.email,
      subject: '🤝 Mise en relation — Procuration Allos',
      html: `
        <h2>Bonjour ${mandant.prenom},</h2>
        <p><strong>${mandataire.prenom} ${mandataire.nom}</strong> accepte de porter votre procuration.</p>
        <p>📧 Email : ${mandataire.email}</p>
        ${mandataire.tel ? `<p>📱 Tél : ${mandataire.tel}</p>` : ''}
        <p>📅 Tour(s) : ${mandataire.tours}</p>
        <hr/>
        <p>Établissez votre procuration sur
        <a href="https://maprocuration.gouv.fr">maprocuration.gouv.fr</a>.</p>
      `
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}