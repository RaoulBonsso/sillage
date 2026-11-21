// @vitest-environment node
import { Duplex } from "node:stream";
import { describe, expect, it } from "vitest";
import { lireMessagesRecus } from "./imap";

/** Faux serveur IMAP : répond ligne à ligne selon un scénario, et garde les commandes reçues. */
function fauxServeur(repondre: (commande: string, flux: Duplex) => string) {
  const commandes: string[] = [];
  const flux: Duplex = new Duplex({
    read() {},
    write(morceau: Buffer, _enc, fin) {
      for (const ligne of morceau.toString("latin1").split("\r\n").filter(Boolean)) {
        commandes.push(ligne);
        const sortie = repondre(ligne, flux);
        if (sortie) flux.push(Buffer.from(sortie, "latin1"));
      }
      fin();
    },
  });
  flux.push(Buffer.from("* OK IMAP pret\r\n", "latin1"));
  return { flux, commandes };
}

const entetes = (id: string, extra: string[] = []) =>
  [`Message-ID: <${id}>`, "From: Camille <camille@acme.fr>", "Subject: Re: candidature", "Date: Thu, 15 Oct 2026 12:00:00 +0200", ...extra, "", ""].join("\r\n");
const fetchUn = (uid: number, brut: string) => `* ${uid} FETCH (UID ${uid} BODY[HEADER.FIELDS (MESSAGE-ID)] {${brut.length}}\r\n${brut})\r\n`;

const scenario = (commande: string) => {
  const [tag, ...reste] = commande.split(" ");
  const verbe = reste.join(" ");
  if (verbe.startsWith("LOGIN")) return `${tag} OK connecte\r\n`;
  if (verbe.startsWith("SELECT")) return `* 3 EXISTS\r\n${tag} OK [READ-ONLY] ok\r\n`;
  if (verbe.startsWith("UID SEARCH")) return `* SEARCH 4 7 9\r\n${tag} OK fait\r\n`;
  if (verbe.startsWith("UID FETCH"))
    return fetchUn(7, entetes("a@acme.fr", ["In-Reply-To: <abc@gmail.com>"])) + fetchUn(9, entetes("b@acme.fr")) + `${tag} OK fait\r\n`;
  if (verbe.startsWith("LOGOUT")) return `* BYE\r\n${tag} OK au revoir\r\n`;
  return `${tag} BAD inconnu\r\n`;
};

const config = { utilisateur: "moi@gmail.com", motDePasse: 'pa"ss\\', depuis: new Date("2026-10-15T08:00:00Z") };

describe("lireMessagesRecus", () => {
  it("se connecte, cherche depuis la date et retourne les messages analysés", async () => {
    const { flux, commandes } = fauxServeur(scenario);
    const messages = await lireMessagesRecus(flux, config);
    expect(messages.map((m) => m.messageId)).toEqual(["<a@acme.fr>", "<b@acme.fr>"]);
    expect(messages[0].enReponseA).toEqual(["<abc@gmail.com>"]);
    expect(commandes[0]).toMatch(/^\S+ LOGIN "moi@gmail.com" "pa\\"ss\\\\"$/);
    expect(commandes.some((c) => c.includes('SELECT "INBOX"'))).toBe(true);
    expect(commandes.some((c) => c.includes("UID SEARCH SINCE 15-Oct-2026"))).toBe(true);
    expect(commandes.some((c) => c.includes("BODY.PEEK[HEADER.FIELDS"))).toBe(true);
    expect(commandes.at(-1)).toMatch(/LOGOUT$/);
  });

  it("ne récupère que les `max` messages les plus récents", async () => {
    const { flux, commandes } = fauxServeur(scenario);
    await lireMessagesRecus(flux, { ...config, max: 2 });
    expect(commandes.find((c) => c.includes("UID FETCH"))).toContain("UID FETCH 7,9 ");
  });

  it("ne demande rien quand la boîte est vide", async () => {
    const { flux, commandes } = fauxServeur((c) => (c.includes("UID SEARCH") ? `* SEARCH\r\n${c.split(" ")[0]} OK\r\n` : scenario(c)));
    expect(await lireMessagesRecus(flux, config)).toEqual([]);
    expect(commandes.some((c) => c.includes("UID FETCH"))).toBe(false);
  });

  it("échoue avec un message clair quand l'authentification est refusée", async () => {
    const { flux } = fauxServeur((c) => (c.includes("LOGIN") ? `${c.split(" ")[0]} NO [AUTHENTICATIONFAILED] refuse\r\n` : scenario(c)));
    await expect(lireMessagesRecus(flux, config)).rejects.toThrow(/LOGIN/);
  });

  it("refuse des identifiants contenant un saut de ligne", async () => {
    const { flux } = fauxServeur(scenario);
    await expect(lireMessagesRecus(flux, { ...config, motDePasse: "a\r\nb" })).rejects.toThrow(/invalides/);
  });

  it("échoue si la connexion se ferme en cours de route", async () => {
    const { flux } = fauxServeur((c, f) => {
      if (c.includes("LOGIN")) f.push(null);
      return "";
    });
    await expect(lireMessagesRecus(flux, config)).rejects.toThrow(/fermée/);
  });
});
