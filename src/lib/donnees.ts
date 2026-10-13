import "server-only";
import { bilanDuJour, OBJECTIFS_DEFAUT, serie } from "@/domaine/serie";
import { activiteParJour } from "@/store/lecture";
import type { Depot } from "@/store/port";
import { contributions } from "./github";

/** Les N derniers jours (le plus ancien d'abord), en AAAA-MM-JJ. */
export function derniersJours(jour: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(`${jour}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

export async function tableau(depot: Depot, jour: string) {
  const [entreprises, cands, posts, rapports, commits] = await Promise.all([
    depot.entreprises.lister(),
    depot.candidatures.lister(),
    depot.posts.lister(),
    depot.rapports.lister(),
    contributions(),
  ]);
  const activite = activiteParJour(cands, posts, commits);
  const jours = derniersJours(jour, 30);
  const bilans = jours.map((j) => bilanDuJour(activite[j] ?? { candidatures: 0, posts: 0, commits: 0 }, OBJECTIFS_DEFAUT));
  return {
    entreprises,
    cands,
    posts,
    rapports: rapports.sort((a, b) => (a.date < b.date ? 1 : -1)),
    jours,
    bilans,
    bilan: bilans.at(-1)!,
    serie: serie(activite, jour, OBJECTIFS_DEFAUT),
  };
}
