import { describe, expect, it } from "vitest";
import { MODELES_PAR_DEFAUT, modeleDeRelance, remplirModele, validerModele } from "./modeles";

const valeurs = { contact: "Alex Exemple", entreprise: "Société Fictive", objet: "Alternance développement", signature: "Camille" };

describe("modeleDeRelance", () => {
  it("choisit le modèle selon le nombre de relances déjà envoyées", () => {
    expect(modeleDeRelance(0)).toBe(MODELES_PAR_DEFAUT[0]);
    expect(modeleDeRelance(1)).toBe(MODELES_PAR_DEFAUT[1]);
  });

  it("garde le dernier modèle au-delà du dernier rang", () => {
    expect(modeleDeRelance(5)).toBe(MODELES_PAR_DEFAUT[1]);
  });

  it("utilise les modèles fournis par l'espace", () => {
    const perso = [{ objet: "A", corps: "a" }, { objet: "B", corps: "b" }];
    expect(modeleDeRelance(1, perso)).toBe(perso[1]);
  });
});

describe("remplirModele", () => {
  it("remplace les variables dans l'objet et le corps, espaces tolérés", () => {
    const m = { objet: "Re: {{objet}}", corps: "Bonjour {{ contact }},\n{{entreprise}} — {{signature}}" };
    expect(remplirModele(m, valeurs)).toEqual({
      objet: "Re: Alternance développement",
      corps: "Bonjour Alex Exemple,\nSociété Fictive — Camille",
    });
  });

  it("ne laisse pas d'espace avant la virgule quand le contact est inconnu", () => {
    const m = { objet: "x", corps: "Bonjour {{contact}}," };
    expect(remplirModele(m, { ...valeurs, contact: "" }).corps).toBe("Bonjour,");
  });

  it("n'interprète pas le contenu d'une valeur", () => {
    const m = { objet: "{{objet}}", corps: "x" };
    expect(remplirModele(m, { ...valeurs, objet: "{{signature}} $&" }).objet).toBe("{{signature}} $&");
  });

  it("propose par défaut un objet en réponse au premier envoi, sans variable restante", () => {
    for (const m of MODELES_PAR_DEFAUT) {
      const r = remplirModele(m, valeurs);
      expect(r.objet).toBe("Re: Alternance développement");
      expect(r.corps).toContain("Bonjour Alex Exemple,");
      expect(r.corps).not.toContain("{{");
    }
    expect(MODELES_PAR_DEFAUT[0].corps).not.toBe(MODELES_PAR_DEFAUT[1].corps);
  });
});

describe("validerModele", () => {
  it("accepte les modèles par défaut", () => {
    for (const m of MODELES_PAR_DEFAUT) expect(validerModele(m)).toBeNull();
  });

  it("refuse un objet ou un message vide", () => {
    expect(validerModele({ objet: " ", corps: "x" })).toBe("L'objet est requis.");
    expect(validerModele({ objet: "x", corps: "" })).toBe("Le message est requis.");
  });

  it("refuse une variable inconnue, qui partirait telle quelle", () => {
    expect(validerModele({ objet: "x", corps: "Bonjour {{prenom}}" })).toBe("Variable inconnue : {{prenom}}.");
  });

  it("refuse des accolades mal fermées", () => {
    expect(validerModele({ objet: "{{objet}", corps: "x" })).toBe("Accolades mal formées.");
  });
});
