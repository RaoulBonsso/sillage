import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Apparition } from "@/components/apparition";
import { LIBELLES } from "@/domaine/pipeline";
import { exigerSession } from "@/lib/serveur";

export const metadata = { title: "Cibles" };

export default async function Cibles({ searchParams }: { searchParams: Promise<{ q?: string; ville?: string }> }) {
  const { q = "", ville = "" } = await searchParams;
  const s = await exigerSession();
  const [ents, cands] = await Promise.all([s.depot.entreprises.lister(), s.depot.candidatures.lister()]);
  const etape = new Map(cands.map((c) => [c.entrepriseId, c.etape]));
  const villes = [...new Set(ents.map((e) => e.ville).filter(Boolean))].sort();
  const n = (x: string) => x.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const liste = ents
    .filter((e) => !ville || e.ville === ville)
    .filter((e) => !q || n(`${e.nom} ${e.secteur} ${e.signal.texte} ${e.contacts.map((c) => c.nom).join(" ")}`).includes(n(q)))
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <Apparition>
        <h1 className="titre-display text-4xl sm:text-5xl">Cibles</h1>
        <p className="mt-2 text-discret">{ents.length} entreprises repérées, chacune avec un signal sourcé. Triées par pertinence.</p>
      </Apparition>
      <form className="mt-6 flex flex-wrap gap-2" role="search">
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <input id="q" name="q" defaultValue={q} placeholder="Nom, secteur, décideur, signal…" className="min-w-0 flex-1 rounded-xl border border-ligne-forte bg-surface px-4 py-2.5 text-sm outline-none focus:border-ecume" />
        <label htmlFor="ville" className="sr-only">Ville</label>
        <select id="ville" name="ville" defaultValue={ville} className="rounded-xl border border-ligne-forte bg-surface px-3 py-2.5 text-sm">
          <option value="">Toutes les villes</option>
          {villes.map((v) => <option key={v}>{v}</option>)}
        </select>
        <button className="rounded-xl bg-texte px-4 text-sm font-medium text-fond hover:bg-ecume">Filtrer</button>
      </form>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {liste.map((e, i) => {
          const et = etape.get(e.id);
          return (
            <Apparition key={e.id} delai={Math.min(i, 10) * 0.03}>
              <li className="carte flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-medium leading-snug">{e.nom}</h2>
                    <p className="text-xs text-discret">{[e.ville, e.secteur, e.effectif].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="relative grid size-12 shrink-0 place-items-center">
                    <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                      <circle cx="18" cy="18" r="15" fill="none" stroke="var(--ligne-forte)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="var(--ecume)" strokeWidth="3" strokeDasharray={`${(e.score / 100) * 94.2} 94.2`} strokeLinecap="round" />
                    </svg>
                    <span className="font-mono text-xs">{e.score}</span>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-discret">{e.signal.texte}</p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-xs">
                  {et ? (
                    <Link href={`/pipeline/${e.id}`} className="puce !border-ecume/40 !text-ecume hover:bg-ecume-doux">{LIBELLES[et]} →</Link>
                  ) : (
                    <span className="puce">Pas encore de dossier</span>
                  )}
                  <a href={e.signal.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-discret hover:text-ecume">
                    source <ExternalLink className="size-3" aria-hidden />
                  </a>
                  <span className="ml-auto text-discret">{e.contacts.length} contact{e.contacts.length > 1 ? "s" : ""}</span>
                </div>
              </li>
            </Apparition>
          );
        })}
      </ul>
      {liste.length === 0 && <p className="mt-10 text-center text-discret">Aucune cible. Les agents en déposent chaque matin via MCP.</p>}
    </div>
  );
}
