import { describe, expect, it } from "vitest";
import { avancer, nouvelleCandidature } from "./pipeline";
import { enregistrerReponse, rapprocherReponse, type MessageRecu } from "./reponses";
import type { Candidature, Contact, Dossier, Entreprise } from "./types";

const dossier: Dossier = { cv: "cv.pdf", lettre: "…", email: { objet: "o", corps: "c" }, miniProjet: "…" };
const contact = (email: string): Contact => ({ nom: "Camille", role: "CTO", email, confiance: "verifie", linkedin: "", source: "" });
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
  contacts: [contact(email)],
  ajouteeLe: "2026-10-01",
});
const envoyee = (id: string): Candidature =>
  avancer(nouvelleCandidature(id, dossier, "2026-10-13T08:00:00.000Z"), "envoyee", "2026-10-13T09:00:00.000Z", "envoyée", "humain", "<" + id + "@gmail.com>");
const message = (m: Partial<MessageRecu> = {}): MessageRecu => ({
  messageId: "<r1@acme.fr>",
  enReponseA: [],
  de: "Camille <camille@acme.fr>",
  objet: "Re: candidature",
  recuLe: "2026-10-15T10:00:00.000Z",
  ...m,
});
const entreprises = [entreprise("acme", "camille@acme.fr"), entreprise("beta", "rh@beta.fr")];

describe("rapprocherReponse", () => {
  it("rattache un message au fil de l'envoi (In-Reply-To), même si l'expéditeur diffère", () => {
    const liste = [envoyee("acme"), envoyee("beta")];
    const m = message({ de: "autre@gmail.com", enReponseA: ["<beta@gmail.com>"] });
    expect(rapprocherReponse(m, liste, entreprises)).toEqual({ candidatureId: "beta", raison: "fil" });
  });

  it("tolère casse, espaces et chevrons manquants dans les identifiants", () => {
    const m = message({ de: "x@y.fr", enReponseA: [" ACME@gmail.com "] });
    expect(rapprocherReponse(m, [envoyee("acme")], entreprises)?.candidatureId).toBe("acme");
  });

  it("à défaut de fil, rattache par l'adresse du contact (nom d'affichage ignoré)", () => {
    expect(rapprocherReponse(message(), [envoyee("acme"), envoyee("beta")], entreprises)).toEqual({
      candidatureId: "acme",
      raison: "expediteur",
    });
  });

  it("refuse un expéditeur inconnu", () => {
    expect(rapprocherReponse(message({ de: "spam@x.fr" }), [envoyee("acme")], entreprises)).toBeNull();
  });

  it("refuse quand l'expéditeur correspond à plusieurs candidatures (ambigu)", () => {
    const deux = [entreprise("a1", "camille@acme.fr"), entreprise("a2", "camille@acme.fr")];
    expect(rapprocherReponse(message(), [envoyee("a1"), envoyee("a2")], deux)).toBeNull();
  });

  it("ignore les candidatures qui ne peuvent plus recevoir de réponse (préparée, déjà en réponse)", () => {
    const preparee = nouvelleCandidature("acme", dossier, "2026-10-13T08:00:00.000Z");
    expect(rapprocherReponse(message(), [preparee], entreprises)).toBeNull();
    const deja = avancer(envoyee("acme"), "reponse", "2026-10-14T09:00:00.000Z");
    expect(rapprocherReponse(message(), [deja], entreprises)).toBeNull();
  });

  it("ignore un message antérieur à l'envoi", () => {
    expect(rapprocherReponse(message({ recuLe: "2026-10-13T08:30:00.000Z" }), [envoyee("acme")], entreprises)).toBeNull();
  });
});

describe("enregistrerReponse", () => {
  it("passe la candidature en « réponse » par un agent, en consignant l'objet et l'identifiant", () => {
    const c = enregistrerReponse(envoyee("acme"), message());
    expect(c.etape).toBe("reponse");
    expect(c.prochaineRelance).toBeNull();
    const e = c.historique.at(-1)!;
    expect(e.type).toBe("reponse");
    expect(e.auteur).toBe("agent");
    expect(e.messageId).toBe("<r1@acme.fr>");
    expect(e.texte).toContain("Re: candidature");
  });

  it("est idempotente : un message déjà consigné ne change rien", () => {
    const une = enregistrerReponse(envoyee("acme"), message());
    expect(enregistrerReponse(une, message())).toBe(une);
  });
});
