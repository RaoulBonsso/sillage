import type { Activite } from "@/domaine/serie";
import type { Candidature, Post } from "@/domaine/types";

/**
 * L'activité n'est jamais saisie : elle se déduit de ce qui s'est réellement
 * passé (envois et relances datés, posts publiés, contributions GitHub).
 */
export function activiteParJour(cands: Candidature[], posts: Post[], commits: Record<string, number>): Record<string, Activite> {
  const a: Record<string, Activite> = {};
  const jour = (j: string) => (a[j] ??= { candidatures: 0, posts: 0, commits: 0 });
  for (const c of cands)
    for (const e of c.historique) if (e.type === "envoi" || e.type === "relance") jour(e.date.slice(0, 10)).candidatures++;
  for (const p of posts) if (p.statut === "publie" && p.publieLe) jour(p.publieLe.slice(0, 10)).posts++;
  for (const [j, n] of Object.entries(commits)) jour(j).commits += n;
  return a;
}
