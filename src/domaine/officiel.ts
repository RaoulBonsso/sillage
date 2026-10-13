/**
 * Données publiques et officielles sur les entreprises françaises :
 * - API Recherche d'entreprises (DINUM, gratuite, sans clé) : Sirene (INSEE) + RNE (INPI)
 * - BODACC (DILA) : annonces légales — créations, modifications, comptes, procédures
 * Rien n'est inventé : chaque fiche renvoie vers ses sources.
 */

export const API_RECHERCHE = "https://recherche-entreprises.api.gouv.fr/search";
export const API_BODACC = "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records";

const TRANCHES: Record<string, string> = {
  NN: "Non employeuse",
  "00": "0 salarié",
  "01": "1 ou 2 salariés",
  "02": "3 à 5 salariés",
  "03": "6 à 9 salariés",
  "11": "10 à 19 salariés",
  "12": "20 à 49 salariés",
  "21": "50 à 99 salariés",
  "22": "100 à 199 salariés",
  "31": "200 à 249 salariés",
  "32": "250 à 499 salariés",
  "41": "500 à 999 salariés",
  "42": "1 000 à 1 999 salariés",
  "51": "2 000 à 4 999 salariés",
  "52": "5 000 à 9 999 salariés",
  "53": "10 000 salariés et plus",
};

export const libelleEffectif = (code?: string | null) => (code && TRANCHES[code]) || "Effectif non renseigné";

/** Raccourcis utiles pour une recherche d'alternance. */
export const EFFECTIFS = [
  { cle: "tpe", libelle: "TPE (1–9)", codes: ["01", "02", "03"] },
  { cle: "pe", libelle: "Petites (10–49)", codes: ["11", "12"] },
  { cle: "me", libelle: "Moyennes (50–249)", codes: ["21", "22", "31"] },
  { cle: "gr", libelle: "Plus de 250", codes: ["32", "41", "42", "51", "52", "53"] },
] as const;

/** Secteurs qui travaillent souvent encore au papier, plus le numérique. Codes NAF rév. 2. */
export const SECTEURS = [
  { naf: "69.10Z", libelle: "Avocats, notaires, huissiers" },
  { naf: "69.20Z", libelle: "Expertise comptable" },
  { naf: "68.31Z", libelle: "Agences immobilières" },
  { naf: "68.32A", libelle: "Syndics, gestion de biens" },
  { naf: "66.22Z", libelle: "Courtiers en assurance" },
  { naf: "71.12B", libelle: "Ingénierie, études techniques" },
  { naf: "43.21A", libelle: "Électricité (BTP)" },
  { naf: "43.22A", libelle: "Plomberie, chauffage (BTP)" },
  { naf: "41.20A", libelle: "Construction de maisons" },
  { naf: "49.41A", libelle: "Transport de marchandises" },
  { naf: "52.29B", libelle: "Affrètement, logistique" },
  { naf: "86.23Z", libelle: "Cabinets dentaires" },
  { naf: "70.22Z", libelle: "Conseil aux entreprises" },
  { naf: "62.01Z", libelle: "Programmation (éditeurs, studios)" },
  { naf: "62.02A", libelle: "Conseil en informatique (ESN)" },
  { naf: "62.03Z", libelle: "Infogérance" },
] as const;

export interface Filtres {
  q?: string;
  departement?: string;
  codePostal?: string;
  naf?: string;
  effectifs?: readonly string[];
  page?: number;
}

export function urlRecherche(f: Filtres): string {
  if (!f.q?.trim() && !f.departement && !f.codePostal && !f.naf) throw new Error("Recherche vide : précisez au moins un critère.");
  const u = new URL(API_RECHERCHE);
  if (f.q?.trim()) u.searchParams.set("q", f.q.trim());
  if (f.departement) u.searchParams.set("departement", f.departement);
  if (f.codePostal) u.searchParams.set("code_postal", f.codePostal);
  if (f.naf) u.searchParams.set("activite_principale", f.naf);
  if (f.effectifs?.length) u.searchParams.set("tranche_effectif_salarie", f.effectifs.join(","));
  u.searchParams.set("etat_administratif", "A");
  u.searchParams.set("per_page", "20");
  u.searchParams.set("page", String(f.page ?? 1));
  return u.toString();
}

export interface Dirigeant {
  nom: string;
  qualite: string;
  personne: "physique" | "morale";
}

export interface FicheOfficielle {
  siren: string;
  nom: string;
  naf: string;
  effectif: string;
  trancheEffectif: string | null;
  categorie: string;
  creation: string | null;
  active: boolean;
  adresse: string;
  ville: string;
  codePostal: string;
  dirigeants: Dirigeant[];
  finances: { annee: string; ca: number | null; resultat: number | null } | null;
}

const titre = (s: string) => s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase());

/* eslint-disable @typescript-eslint/no-explicit-any -- frontière avec une API externe, normalisée ici */
export function versFiche(r: any): FicheOfficielle {
  const siege = r.siege ?? {};
  const annees = Object.keys(r.finances ?? {}).sort();
  const derniere = annees.at(-1);
  return {
    siren: String(r.siren),
    nom: r.nom_complet ?? r.nom_raison_sociale ?? "",
    naf: r.activite_principale ?? "",
    effectif: libelleEffectif(r.tranche_effectif_salarie),
    trancheEffectif: r.tranche_effectif_salarie ?? null,
    categorie: r.categorie_entreprise ?? "",
    creation: r.date_creation ?? null,
    active: r.etat_administratif !== "F",
    adresse: siege.adresse ?? "",
    ville: siege.libelle_commune ? titre(siege.libelle_commune) : "",
    codePostal: siege.code_postal ?? "",
    // Volontairement, ni date de naissance ni nationalité : inutiles pour candidater.
    dirigeants: (r.dirigeants ?? []).map((d: any) =>
      d.type_dirigeant === "personne morale"
        ? { nom: d.denomination ?? "", qualite: d.qualite ?? "", personne: "morale" as const }
        : { nom: titre(`${(d.prenoms ?? "").split(" ")[0]} ${d.nom ?? ""}`.trim()), qualite: d.qualite ?? "", personne: "physique" as const },
    ),
    finances: derniere ? { annee: derniere, ca: r.finances[derniere]?.ca ?? null, resultat: r.finances[derniere]?.resultat_net ?? null } : null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function liensOfficiels(siren: string) {
  return [
    { titre: "Annuaire des entreprises", url: `https://annuaire-entreprises.data.gouv.fr/entreprise/${siren}` },
    { titre: "Registre national (INPI)", url: `https://data.inpi.fr/entreprises/${siren}` },
    { titre: "Annonces BODACC", url: `https://www.bodacc.fr/pages/annonces-commerciales/?q.registre=registre:${siren}` },
  ];
}

export function urlBodacc(siren: string, n = 5): string {
  const u = new URL(API_BODACC);
  u.searchParams.set("where", `registre like "${siren.replace(/\D/g, "")}"`);
  u.searchParams.set("order_by", "dateparution desc");
  u.searchParams.set("limit", String(n));
  u.searchParams.set("select", "dateparution,familleavis_lib,typeavis_lib,url_complete");
  return u.toString();
}
