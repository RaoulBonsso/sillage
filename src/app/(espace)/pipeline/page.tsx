import Link from "next/link";
import { Apparition } from "@/components/apparition";
import { LIBELLES, enRetard } from "@/domaine/pipeline";
import type { Etape } from "@/domaine/types";
import { aujourdhui, exigerSession } from "@/lib/serveur";

export const metadata = { title: "Candidatures" };

const COLONNES: { titre: string; etapes: Etape[]; ton: string }[] = [
  { titre: "À envoyer", etapes: ["reperee", "preparee"], ton: "text-texte" },
  { titre: "En attente", etapes: ["envoyee", "relancee"], ton: "text-ecume" },
  { titre: "En discussion", etapes: ["reponse", "entretien", "offre"], ton: "text-lune" },
  { titre: "Issue", etapes: ["signee", "refusee", "close"], ton: "text-discret" },
];

export default async function Pipeline() {
  const s = await exigerSession();
  const jour = aujourdhui();
  const [cands, ents] = await Promise.all([s.depot.candidatures.lister(), s.depot.entreprises.lister()]);
  const ent = new Map(ents.map((e) => [e.id, e]));
  const envoyees = cands.filter((c) => c.envoyeeLe).length;
  const reponses = cands.filter((c) => c.historique.some((h) => ["reponse", "entretien", "offre", "refus"].includes(h.type))).length;

  return (
    <div>
      <Apparition>
        <h1 className="titre-display text-4xl sm:text-5xl">Candidatures</h1>
        <p className="mt-2 text-discret">
          {cands.length} au total · {envoyees} envoyées · taux de réponse{" "}
          <span className="font-mono text-texte">{envoyees ? Math.round((reponses / envoyees) * 100) : 0} %</span>
        </p>
      </Apparition>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLONNES.map((col, i) => {
          const liste = cands
            .filter((c) => col.etapes.includes(c.etape))
            .sort((a, b) => (a.prochaineRelance ?? "9") .localeCompare(b.prochaineRelance ?? "9") || (b.majLe > a.majLe ? 1 : -1));
          return (
            <Apparition key={col.titre} delai={i * 0.05}>
              <section aria-labelledby={`col-${i}`} className="rounded-2xl border border-ligne bg-surface/50 p-3">
                <h2 id={`col-${i}`} className={`flex items-center justify-between px-2 py-1 text-sm font-medium ${col.ton}`}>
                  {col.titre} <span className="font-mono text-discret">{liste.length}</span>
                </h2>
                <ul className="mt-2 space-y-2">
                  {liste.map((c) => {
                    const e = ent.get(c.entrepriseId);
                    const retard = enRetard(c, jour);
                    const due = c.prochaineRelance !== null && c.prochaineRelance <= jour;
                    return (
                      <li key={c.id}>
                        <Link href={`/pipeline/${c.id}`} className={`block rounded-xl border bg-surface p-3.5 transition hover:-translate-y-0.5 hover:border-ligne-forte ${due ? "border-balise/50" : "border-ligne"}`}>
                          <p className="flex items-start justify-between gap-2">
                            <span className="font-medium leading-snug">{e?.nom ?? c.entrepriseId}</span>
                            {e && <span className="font-mono text-xs text-discret">{e.score}</span>}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-discret">{[e?.ville, e?.contacts[c.contactIndex]?.role].filter(Boolean).join(" · ")}</p>
                          <p className="mt-2 flex items-center justify-between text-xs">
                            <span className="puce !py-0">{LIBELLES[c.etape]}</span>
                            {c.prochaineRelance && <span className={`font-mono ${retard ? "text-balise" : due ? "text-balise" : "text-discret"}`}>↻ {c.prochaineRelance.slice(5)}</span>}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                  {liste.length === 0 && <li className="px-2 py-6 text-center text-xs text-discret">Vide</li>}
                </ul>
              </section>
            </Apparition>
          );
        })}
      </div>
    </div>
  );
}
