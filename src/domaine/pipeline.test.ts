import { describe, expect, it } from "vitest";
import { avancer, enRetard, nouvelleCandidature, relancesDues } from "./pipeline";
import type { Dossier } from "./types";

const dossier: Dossier = { cv: "cv.pdf", lettre: "…", email: { objet: "o", corps: "c" }, miniProjet: "…" };
const base = () => nouvelleCandidature("acme", dossier, "2026-10-13T08:00:00.000Z");

describe("nouvelleCandidature", () => {
  it("démarre préparée, sans relance, avec un événement de préparation", () => {
    const c = base();
    expect(c.etape).toBe("preparee");
    expect(c.prochaineRelance).toBeNull();
    expect(c.historique).toHaveLength(1);
    expect(c.historique[0].type).toBe("preparation");
  });
});

describe("avancer", () => {
  it("planifie la 1re relance 5 jours ouvrés après l'envoi", () => {
    const c = avancer(base(), "envoyee", "2026-10-13T09:00:00.000Z");
    expect(c.envoyeeLe).toBe("2026-10-13T09:00:00.000Z");
    expect(c.prochaineRelance).toBe("2026-10-20");
    expect(c.historique.at(-1)?.type).toBe("envoi");
  });

  it("une relance repousse la suivante de 7 jours ouvrés, puis plus rien après 2", () => {
    let c = avancer(base(), "envoyee", "2026-10-13T09:00:00.000Z");
    c = avancer(c, "relancee", "2026-10-20T09:00:00.000Z");
    expect(c.relances).toBe(1);
    expect(c.prochaineRelance).toBe("2026-10-29");
    c = avancer(c, "relancee", "2026-10-29T09:00:00.000Z");
    expect(c.relances).toBe(2);
    expect(c.prochaineRelance).toBeNull();
  });

  it("une réponse arrête les relances", () => {
    let c = avancer(base(), "envoyee", "2026-10-13T09:00:00.000Z");
    c = avancer(c, "reponse", "2026-10-14T09:00:00.000Z");
    expect(c.prochaineRelance).toBeNull();
  });

  it("refuse un retour en arrière vers repérée", () => {
    const c = avancer(base(), "envoyee", "2026-10-13T09:00:00.000Z");
    expect(() => avancer(c, "reperee", "2026-10-14T09:00:00.000Z")).toThrow(/transition/i);
  });

  it("refuse de relancer une candidature jamais envoyée", () => {
    expect(() => avancer(base(), "relancee", "2026-10-14T09:00:00.000Z")).toThrow(/transition/i);
  });

  it("n'altère pas la candidature d'origine", () => {
    const c = base();
    avancer(c, "envoyee", "2026-10-13T09:00:00.000Z");
    expect(c.etape).toBe("preparee");
  });
});

describe("relancesDues / enRetard", () => {
  it("liste les candidatures dont la relance tombe aujourd'hui ou avant", () => {
    const a = avancer({ ...base(), id: "a" }, "envoyee", "2026-10-13T09:00:00.000Z"); // relance 20/10
    const b = avancer({ ...base(), id: "b" }, "envoyee", "2026-10-16T09:00:00.000Z"); // relance 23/10
    expect(relancesDues([a, b], "2026-10-21").map((c) => c.id)).toEqual(["a"]);
    expect(enRetard(a, "2026-10-21")).toBe(true);
    expect(enRetard(a, "2026-10-20")).toBe(false);
  });
});
