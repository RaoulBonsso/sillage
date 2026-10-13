import { describe, expect, it } from "vitest";
import { lireCibles, lirePosts } from "./journal";

describe("lireCibles", () => {
  it("normalise une cible d'agent et borne le score", () => {
    const [e] = lireCibles(
      [{ id: "123", nom: "Acme", ville: "Nantes", secteur: "BTP", score: 140, signal: { texte: "devis papier", source: "https://acme.fr" }, contacts: [{ nom: "Jo", role: "DG", email: "jo@acme.fr", confiance: "verifie", source: "https://acme.fr/equipe" }] }],
      "2026-10-13",
    );
    expect(e.score).toBe(100);
    expect(e.contacts[0].linkedin).toBe("");
    expect(e.ajouteeLe).toBe("2026-10-13");
  });
  it("rejette une cible sans source de signal", () => {
    expect(() => lireCibles([{ id: "1", nom: "X", signal: { texte: "y" } }], "2026-10-13")).toThrow();
  });
});

describe("lirePosts", () => {
  it("donne un identifiant stable date+créneau", () => {
    const [p] = lirePosts([{ date: "2026-10-13", creneau: "midi", heure: "12:30", titre: "t", texte: "x".repeat(50), hashtags: [], sources: [] }]);
    expect(p.id).toBe("2026-10-13-midi");
    expect(p.statut).toBe("a_publier");
  });
  it("refuse un créneau inconnu", () => {
    expect(() => lirePosts([{ date: "2026-10-13", creneau: "nuit", texte: "x" }])).toThrow();
  });
});
