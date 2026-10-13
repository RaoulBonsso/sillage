/** Le « sillage » : la trace des jours où les engagements quotidiens ont été tenus. */

export interface Activite {
  candidatures: number;
  posts: number;
  commits: number;
}

export type Objectifs = Activite;

export const OBJECTIFS_DEFAUT: Objectifs = { candidatures: 5, posts: 3, commits: 1 };

const LIBELLE: Record<keyof Activite, string> = {
  candidatures: "Candidatures envoyées",
  posts: "Posts LinkedIn publiés",
  commits: "Contributions GitHub",
};

export function bilanDuJour(a: Activite, o: Objectifs) {
  const objectifs = (Object.keys(o) as (keyof Activite)[]).map((cle) => ({
    cle,
    libelle: LIBELLE[cle],
    valeur: a[cle],
    cible: o[cle],
    fait: a[cle] >= o[cle],
  }));
  const progression = objectifs.reduce((s, x) => s + Math.min(1, x.valeur / Math.max(1, x.cible)), 0) / objectifs.length;
  return { objectifs, progression, atteint: objectifs.every((x) => x.fait) };
}

function veille(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Jours consécutifs atteints. Aujourd'hui compte s'il est atteint, sans casser la série s'il est en cours. */
export function serie(activite: Record<string, Activite>, aujourdhui: string, o: Objectifs): number {
  const atteint = (j: string) => !!activite[j] && bilanDuJour(activite[j], o).atteint;
  let n = atteint(aujourdhui) ? 1 : 0;
  let jour = veille(aujourdhui);
  while (atteint(jour)) {
    n++;
    jour = veille(jour);
  }
  return n;
}
