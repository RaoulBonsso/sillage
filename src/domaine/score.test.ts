import { describe, expect, it } from "vitest";
import { PONDERATIONS, expliquerScore } from "./score";
import type { Contact, Entreprise } from "./types";

const contact = (c: Partial<Contact> = {}): Contact => ({
  nom: "A",
  role: "CTO",
  email: "a@exemple.fr",
  confiance: "verifie",
  linkedin: "",
  source: "",
  ...c,
});

const vide: Entreprise = {
  id: "e1",
  nom: "Exemple",
  ville: "Lyon",
  secteur: "",
  naf: "",
  effectif: "",
  site: "",
  signal: { texte: "", source: "" },
  angle: "",
  score: 0,
  contacts: [],
  ajouteeLe: "2026-01-01",
};

describe("expliquerScore", () => {
  it("les pondérations visibles totalisent 100", () => {
    expect(Object.values(PONDERATIONS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("une cible sans information vaut 0 et chaque critère dit pourquoi", () => {
    const r = expliquerScore(vide);
    expect(r.total).toBe(0);
    expect(r.criteres).toHaveLength(Object.keys(PONDERATIONS).length);
    for (const c of r.criteres) {
      expect(c.points).toBe(0);
      expect(c.raison).not.toBe("");
    }
  });

  it("une cible complète vaut 100", () => {
    const r = expliquerScore({
      ...vide,
      secteur: "Logiciel",
      effectif: "20 à 49 salariés",
      site: "https://exemple.fr",
      angle: "Refonte de leur outil",
      signal: { texte: "Recrute un dev", source: "https://exemple.fr/emploi" },
      contacts: [contact()],
    });
    expect(r.total).toBe(100);
  });

  it("un signal sans source ne vaut que la moitié", () => {
    const r = expliquerScore({ ...vide, signal: { texte: "Recrute", source: "" } });
    const s = r.criteres.find((c) => c.cle === "signal")!;
    expect(s.points).toBe(PONDERATIONS.signal / 2);
    expect(r.total).toBe(s.points);
  });

  it("retient le meilleur contact : vérifié > deviné > sans e-mail", () => {
    const pts = (contacts: Contact[]) => expliquerScore({ ...vide, contacts }).criteres.find((c) => c.cle === "contact")!.points;
    const verifie = pts([contact()]);
    const devine = pts([contact({ confiance: "devine" })]);
    const sansMail = pts([contact({ email: "" })]);
    expect(verifie).toBe(PONDERATIONS.contact);
    expect(verifie).toBeGreaterThan(devine);
    expect(devine).toBeGreaterThan(sansMail);
    expect(sansMail).toBeGreaterThan(0);
    expect(pts([contact({ confiance: "devine" }), contact()])).toBe(verifie);
  });
});
