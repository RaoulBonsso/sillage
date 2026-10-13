import "server-only";
import nodemailer from "nodemailer";

export interface Courriel {
  a: string;
  objet: string;
  texte: string;
  pieces?: { nom: string; type: string; donnees: Buffer }[];
}

/** Envoi SMTP (Gmail + mot de passe d'application). Les messages partent du compte de l'utilisateur. */
export async function envoyer(c: Courriel) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("Envoi non configuré : GMAIL_USER / GMAIL_APP_PASSWORD manquants");
  const t = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  const info = await t.sendMail({
    from: process.env.SILLAGE_EXPEDITEUR ? `${process.env.SILLAGE_EXPEDITEUR} <${user}>` : user,
    to: c.a,
    subject: c.objet,
    text: c.texte,
    attachments: c.pieces?.map((p) => ({ filename: p.nom, contentType: p.type, content: p.donnees })),
  });
  return info.messageId as string;
}
