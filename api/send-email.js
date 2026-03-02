import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.me.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,     // julien.roger@me.com
    pass: process.env.SMTP_PASSWORD, // mot de passe spécifique Apple
  },
});

const TOUR_LABELS = {
  tour1: "1er tour (15 mars)",
  tour2: "2nd tour (22 mars)",
  both: "Les deux tours (15 et 22 mars)",
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mandataire, mandant } = req.body;

  if (!mandataire?.email || !mandant?.email) {
    return res.status(400).json({ error: 'Emails manquants' });
  }

  try {
    // Email au mandataire
    await transporter.sendMail({
      from: `"Le Seignus Renaissance" <${process.env.GMAIL_USER}>`,
      to: mandataire.email,
      subject: '🤝 Mise en relation — Procuration Allos',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #c2410c;">Bonjour ${mandataire.prenom},</h2>
          <p><strong>${mandant.prenom} ${mandant.nom}</strong> souhaite vous confier sa procuration pour les élections à Allos.</p>
          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;">📧 <strong>Email :</strong> ${mandant.email}</p>
            ${mandant.tel ? `<p style="margin: 4px 0;">📱 <strong>Tél :</strong> ${mandant.tel}</p>` : ''}
            <p style="margin: 4px 0;">📅 <strong>Tour(s) :</strong> ${TOUR_LABELS[mandant.tours] || mandant.tours}</p>
            ${mandant.message ? `<p style="margin: 4px 0;">💬 <strong>Message :</strong> <em>${mandant.message}</em></p>` : ''}
          </div>
          <p>Prenez contact pour organiser la procuration.</p>
          <p style="background: #fefce8; padding: 12px; border-radius: 8px; font-size: 14px;">
            💡 Le mandant doit établir la procuration sur
            <a href="https://maprocuration.gouv.fr" style="color: #c2410c; font-weight: bold;">maprocuration.gouv.fr</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Le Seignus Renaissance — Initiative citoyenne pour Allos</p>
        </div>
      `,
    });

    // Email au mandant
    await transporter.sendMail({
      from: `"Le Seignus Renaissance" <${process.env.GMAIL_USER}>`,
      to: mandant.email,
      subject: '🤝 Mise en relation — Procuration Allos',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #c2410c;">Bonjour ${mandant.prenom},</h2>
          <p><strong>${mandataire.prenom} ${mandataire.nom}</strong> accepte de porter votre procuration pour les élections à Allos.</p>
          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;">📧 <strong>Email :</strong> ${mandataire.email}</p>
            ${mandataire.tel ? `<p style="margin: 4px 0;">📱 <strong>Tél :</strong> ${mandataire.tel}</p>` : ''}
            <p style="margin: 4px 0;">📅 <strong>Tour(s) :</strong> ${TOUR_LABELS[mandataire.tours] || mandataire.tours}</p>
          </div>
          <p>Contactez votre mandataire, puis établissez la procuration :</p>
          <p style="background: #fefce8; padding: 12px; border-radius: 8px; font-size: 14px;">
            👉 Rendez-vous sur
            <a href="https://maprocuration.gouv.fr" style="color: #c2410c; font-weight: bold;">maprocuration.gouv.fr</a>
            en indiquant l'identité de votre mandataire.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Le Seignus Renaissance — Initiative citoyenne pour Allos</p>
        </div>
      `,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur envoi email:', error);
    res.status(500).json({ error: error.message });
  }
}
