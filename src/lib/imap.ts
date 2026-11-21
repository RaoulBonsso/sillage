import type { Duplex } from "node:stream";
import tls from "node:tls";
import type { MessageRecu } from "@/domaine/reponses";
import { analyserEntetes } from "./entetes";

export interface ConfigImap {
  utilisateur: string;
  motDePasse: string;
  /** Ne considère que les messages reçus à partir de ce jour (UTC). */
  depuis: Date;
  /** Nombre maximal de messages (les plus récents) à lire. */
  max?: number;
}

const MOIS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dateImap = (d: Date) => `${String(d.getUTCDate()).padStart(2, "0")}-${MOIS[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
const citer = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

interface Reponse {
  statut: "OK" | "NO" | "BAD";
  /** Lignes non étiquetées (`* ...`). */
  lignes: string[];
  /** Contenu des littéraux `{n}` reçus, dans l'ordre. */
  litteraux: string[];
}

/** Extrait de `tampon` la réponse complète à la commande `tag`, ou null si elle n'est pas encore arrivée. */
function extraireReponse(tampon: Buffer, tag: string): { reponse: Reponse; reste: Buffer } | null {
  const lignes: string[] = [];
  const litteraux: string[] = [];
  let pos = 0;
  while (pos < tampon.length) {
    const fin = tampon.indexOf("\r\n", pos, "latin1");
    if (fin === -1) return null;
    const ligne = tampon.toString("latin1", pos, fin);
    pos = fin + 2;
    if (ligne.startsWith(`${tag} `)) {
      const statut = ligne.slice(tag.length + 1).split(" ")[0] as Reponse["statut"];
      return { reponse: { statut, lignes, litteraux }, reste: tampon.subarray(pos) };
    }
    lignes.push(ligne);
    const litteral = /\{(\d+)\}$/.exec(ligne);
    if (litteral) {
      const taille = Number(litteral[1]);
      if (tampon.length < pos + taille) return null;
      litteraux.push(tampon.toString("latin1", pos, pos + taille));
      pos += taille;
    }
  }
  return null;
}

/**
 * Lit, via IMAP et sur un flux déjà ouvert (TLS en production), les en-têtes des messages
 * de la boîte de réception reçus depuis `depuis`. Lecture seule : rien n'est marqué comme lu.
 * Échoue si l'authentification est refusée ou si la connexion se ferme en cours de route.
 */
export async function lireMessagesRecus(flux: Duplex, config: ConfigImap): Promise<MessageRecu[]> {
  if (/[\r\n]/.test(config.utilisateur + config.motDePasse)) throw new Error("Identifiants IMAP invalides");

  let tampon: Buffer = Buffer.alloc(0);
  let ferme = false;
  let reveil: (() => void) | null = null;
  const signaler = () => reveil?.();
  flux.on("data", (morceau: Buffer) => {
    tampon = Buffer.concat([tampon, morceau]);
    signaler();
  });
  flux.on("end", () => ((ferme = true), signaler()));
  flux.on("close", () => ((ferme = true), signaler()));
  flux.on("error", () => ((ferme = true), signaler()));

  const attendre = async (tag: string): Promise<Reponse> => {
    for (;;) {
      const trouve = extraireReponse(tampon, tag);
      if (trouve) {
        tampon = Buffer.from(trouve.reste);
        return trouve.reponse;
      }
      if (ferme) throw new Error("Connexion IMAP fermée avant la fin de la réponse");
      await new Promise<void>((ok) => (reveil = ok));
    }
  };

  let n = 0;
  const commander = async (commande: string): Promise<Reponse> => {
    const tag = `S${++n}`;
    flux.write(`${tag} ${commande}\r\n`);
    const reponse = await attendre(tag);
    if (reponse.statut !== "OK") throw new Error(`IMAP : ${commande.split(" ")[0]} refusé (${reponse.statut})`);
    return reponse;
  };

  try {
    // Salutation du serveur (ligne `* OK`) : on attend qu'elle soit arrivée avant de s'authentifier.
    while (!tampon.includes("\r\n")) {
      if (ferme) throw new Error("Connexion IMAP fermée avant la salutation");
      await new Promise<void>((ok) => (reveil = ok));
    }
    tampon = Buffer.from(tampon.subarray(tampon.indexOf("\r\n") + 2));

    await commander(`LOGIN ${citer(config.utilisateur)} ${citer(config.motDePasse)}`);
    await commander(`SELECT ${citer("INBOX")}`);
    const recherche = await commander(`UID SEARCH SINCE ${dateImap(config.depuis)}`);
    const uids = recherche.lignes
      .filter((l) => l.startsWith("* SEARCH"))
      .flatMap((l) => l.slice("* SEARCH".length).trim().split(/\s+/))
      .filter(Boolean)
      .map(Number)
      .sort((a, b) => a - b)
      .slice(-(config.max ?? 50));
    if (uids.length === 0) return [];

    const champs = "MESSAGE-ID IN-REPLY-TO REFERENCES FROM SUBJECT DATE";
    const lecture = await commander(`UID FETCH ${uids.join(",")} (BODY.PEEK[HEADER.FIELDS (${champs})])`);
    return lecture.litteraux.map(analyserEntetes).filter((m): m is MessageRecu => m !== null);
  } finally {
    // Fermeture polie, sans attendre : le résultat de la lecture est déjà acquis (ou l'erreur déjà levée).
    try {
      flux.write(`S${++n} LOGOUT\r\n`);
      flux.end();
    } catch {
      /* flux déjà fermé */
    }
  }
}

/** Ouvre la connexion TLS vers la boîte Gmail (`GMAIL_USER` / `GMAIL_APP_PASSWORD`) et lit les messages récents. */
export async function lireBoiteGmail(depuis: Date, max?: number): Promise<MessageRecu[]> {
  const utilisateur = process.env.GMAIL_USER;
  const motDePasse = process.env.GMAIL_APP_PASSWORD;
  if (!utilisateur || !motDePasse) throw new Error("Lecture non configurée : GMAIL_USER / GMAIL_APP_PASSWORD manquants");
  const flux = tls.connect({ host: "imap.gmail.com", port: 993, servername: "imap.gmail.com" });
  await new Promise<void>((ok, ko) => {
    flux.once("secureConnect", ok);
    flux.once("error", ko);
  });
  return lireMessagesRecus(flux, { utilisateur, motDePasse, depuis, max });
}
