import { urlBodacc, urlRecherche, versFiche, type FicheOfficielle, type Filtres } from "@/domaine/officiel";

/** L'API publique limite à ~7 requêtes/s : on met en cache côté Next (1 jour, les registres bougent peu). */
const JOUR = 86_400;

export async function rechercher(f: Filtres): Promise<{ total: number; fiches: FicheOfficielle[] }> {
  const r = await fetch(urlRecherche(f), { next: { revalidate: JOUR }, headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`Annuaire des entreprises indisponible (${r.status})`);
  const j = await r.json();
  return { total: j.total_results ?? 0, fiches: (j.results ?? []).map(versFiche) };
}

export async function fiche(siren: string): Promise<FicheOfficielle | null> {
  if (!/^\d{9}$/.test(siren)) return null;
  const { fiches } = await rechercher({ q: siren });
  return fiches.find((x) => x.siren === siren) ?? null;
}

export interface Annonce {
  date: string;
  famille: string;
  type: string;
  url: string;
}

export async function annonces(siren: string, n = 5): Promise<Annonce[]> {
  if (!/^\d{9}$/.test(siren)) return [];
  try {
    const r = await fetch(urlBodacc(siren, n), { next: { revalidate: JOUR } });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.results ?? []).map((a: Record<string, string>) => ({ date: a.dateparution, famille: a.familleavis_lib ?? "", type: a.typeavis_lib ?? "", url: a.url_complete }));
  } catch {
    return [];
  }
}

export const officiel = { rechercher, fiche, annonces };
export type Officiel = typeof officiel;
