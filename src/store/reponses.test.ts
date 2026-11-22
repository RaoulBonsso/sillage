import { describe, expect, it } from "vitest";
import { avancer, nouvelleCandidature } from "@/domaine/pipeline";
import type { MessageRecu } from "@/domaine/reponses";
import type { Dossier, Entreprise } from "@/domaine/types";
import { depotMemoire } from "./memoire";
import { chercherReponses } from "./reponses";

const dossier: Dossier = { cv: "cv.pdf", lettre: "…", email: { objet: "o", corps: "c" }, miniProjet: "…" };
const entreprise = (id: string, email: string): Entreprise => ({
  id,
  nom: id,
  ville: "",
  secteur: "",
  naf: "",
  effectif: "",
  site: "",
  signal: { texte: "", source: "" },
  angle: "",
  score: 0,
  contacts: [{ nom: "Camille", role: "CTO", email, confiance: "verifie", linkedin: "", source: "" }],
  ajouteeLe: "2026-10-01",
});
const message = (m: Partial<MessageRecu> = {}): MessageRecu => ({
  messageId: "<r1@acme.fr>",
  enReponseA: ["<acme@gmail.com>"],
  de: "Camille <camille@acme.fr>",
  objet: "Re: candidature",
  recuLe: "2026-10-15T10:00:00.000Z",
  ...m,
});

async function depotAvecEnvoi() {
  const d = depotMemoire();
  await d.entreprises.ecrire(entreprise("acme", "camille@acme.fr"));
  await d.candidatures.ecrire(
    avancer(nouvelleCandidature("acme", dossier, "2026-10-13T08:00:00.000Z"), "envoyee", "2026-10-13T09:00:00.000Z", "envoyée", "humain", "<acme@gmail.com>"),
  );
  return d;
}

describe("chercherReponses", () => {
  it("passe la candidature en « réponse » et la persiste", async () => {
    const d = await depotAvecEnvoi();
    const bilan = await chercherReponses(d, [message()]);
    expect(bilan).toEqual({ lus: 1, enregistrees: [{ candidatureId: "acme", messageId: "<r1@acme.fr>" }], ignores: 0 });
    expect((await d.candidatures.lire("acme"))?.etape).toBe("reponse");
  });

  it("ignore les messages sans candidature correspondante", async () => {
    const d = await depotAvecEnvoi();
    const bilan = await chercherReponses(d, [message({ enReponseA: [], de: "inconnu@ailleurs.fr" })]);
    expect(bilan).toEqual({ lus: 1, enregistrees: [], ignores: 1 });
    expect((await d.candidatures.lire("acme"))?.etape).toBe("envoyee");
  });

  it("est idempotente : relire le même message n'enregistre rien de plus", async () => {
    const d = await depotAvecEnvoi();
    await chercherReponses(d, [message()]);
    const historique = (await d.candidatures.lire("acme"))!.historique.length;
    const bilan = await chercherReponses(d, [message()]);
    expect(bilan.enregistrees).toEqual([]);
    expect((await d.candidatures.lire("acme"))!.historique).toHaveLength(historique);
  });

  it("ne traite qu'une réponse par candidature dans un même lot", async () => {
    const d = await depotAvecEnvoi();
    const bilan = await chercherReponses(d, [message(), message({ messageId: "<r2@acme.fr>" })]);
    expect(bilan.enregistrees).toHaveLength(1);
    expect(bilan.ignores).toBe(1);
  });
});
