import { describe, expect, it } from "vitest";
import { liensOfficiels, libelleEffectif, urlRecherche, versFiche } from "./officiel";

const brut = {
  siren: "807728126",
  nom_complet: "LONESTONE GROUP (LONE STONE STUDIO)",
  activite_principale: "62.01Z",
  tranche_effectif_salarie: "12",
  date_creation: "2014-10-30",
  etat_administratif: "A",
  categorie_entreprise: "PME",
  siege: { adresse: "21 PLACE DE LA REPUBLIQUE 75003 PARIS", libelle_commune: "PARIS", code_postal: "75003" },
  dirigeants: [
    { nom: "BIGNET", prenoms: "PIERRICK", date_de_naissance: "1989-06", qualite: "Président de SAS", type_dirigeant: "personne physique" },
    { denomination: "2L ASSOCIES", siren: "123456789", qualite: "Président", type_dirigeant: "personne morale" },
  ],
  finances: { "2022": { ca: 1500000, resultat_net: 80000 }, "2023": { ca: 1800000, resultat_net: 95000 } },
};

describe("versFiche", () => {
  it("normalise une réponse de l'API Recherche d'entreprises", () => {
    const f = versFiche(brut);
    expect(f.siren).toBe("807728126");
    expect(f.effectif).toBe("20 à 49 salariés");
    expect(f.ville).toBe("Paris");
    expect(f.active).toBe(true);
    expect(f.finances).toEqual({ annee: "2023", ca: 1800000, resultat: 95000 });
  });

  it("met les noms en forme et ne garde aucune date de naissance (donnée personnelle inutile)", () => {
    const f = versFiche(brut);
    expect(f.dirigeants[0]).toEqual({ nom: "Pierrick Bignet", qualite: "Président de SAS", personne: "physique" });
    expect(f.dirigeants[1]).toEqual({ nom: "2L ASSOCIES", qualite: "Président", personne: "morale" });
    expect(JSON.stringify(f)).not.toContain("1989");
  });

  it("tolère les champs absents", () => {
    const f = versFiche({ siren: "1", nom_complet: "X" });
    expect(f.dirigeants).toEqual([]);
    expect(f.finances).toBeNull();
    expect(f.effectif).toBe("Effectif non renseigné");
  });
});

describe("libelleEffectif", () => {
  it("traduit les tranches INSEE", () => {
    expect(libelleEffectif("00")).toBe("0 salarié");
    expect(libelleEffectif("31")).toBe("200 à 249 salariés");
    expect(libelleEffectif("NN")).toBe("Non employeuse");
  });
});

describe("urlRecherche", () => {
  it("construit une requête filtrée sur les entreprises actives", () => {
    const u = new URL(urlRecherche({ q: "cabinet", departement: "44", naf: "69.10Z", effectifs: ["11", "12"], page: 2 }));
    expect(u.origin).toBe("https://recherche-entreprises.api.gouv.fr");
    expect(u.searchParams.get("departement")).toBe("44");
    expect(u.searchParams.get("activite_principale")).toBe("69.10Z");
    expect(u.searchParams.get("tranche_effectif_salarie")).toBe("11,12");
    expect(u.searchParams.get("etat_administratif")).toBe("A");
    expect(u.searchParams.get("page")).toBe("2");
  });
  it("refuse une recherche vide (l'API l'exige)", () => {
    expect(() => urlRecherche({})).toThrow();
  });
});

describe("liensOfficiels", () => {
  it("pointe vers l'annuaire, l'INPI et le BODACC", () => {
    const l = liensOfficiels("807728126");
    expect(l.map((x) => new URL(x.url).hostname)).toEqual(["annuaire-entreprises.data.gouv.fr", "data.inpi.fr", "www.bodacc.fr"]);
  });
});
