import Link from "next/link";
import { ArrowUpRight, BellRing, Flame, Send, Sparkles } from "lucide-react";
import { Anneau } from "@/components/anneau";
import { Apparition } from "@/components/apparition";
import { Markdown } from "@/components/markdown";
import { Sillage } from "@/components/sillage";
import { relancesDues } from "@/domaine/pipeline";
import { tableau } from "@/lib/donnees";
import { aujourdhui, exigerSession } from "@/lib/serveur";

export const metadata = { title: "Aujourd'hui" };

const CRENEAU = { matin: "Actualité", midi: "Projet", soir: "Valeur" } as const;

export default async function Aujourdhui() {
  const s = await exigerSession();
  const jour = aujourdhui();
  const t = await tableau(s.depot, jour);
  const nom = (id: string) => t.entreprises.find((e) => e.id === id)?.nom ?? id;
  const dues = relancesDues(t.cands, jour);
  const aEnvoyer = t.cands.filter((c) => c.etape === "preparee").sort((a, b) => (t.entreprises.find((e) => e.id === b.entrepriseId)?.score ?? 0) - (t.entreprises.find((e) => e.id === a.entrepriseId)?.score ?? 0));
  const postsJour = t.posts.filter((p) => p.date === jour).sort((a, b) => a.heure.localeCompare(b.heure));
  const rapport = t.rapports.find((r) => r.date === jour) ?? t.rapports[0];
  const date = new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      <Apparition>
        <p className="text-sm capitalize text-discret">{date}</p>
        <h1 className="titre-display mt-1 text-4xl sm:text-6xl">
          {t.bilan.atteint ? <>Journée tenue. <em className="text-or">Bravo.</em></> : <>Le cap du jour.</>}
        </h1>
      </Apparition>

      <Apparition delai={0.05} className="carte overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 pt-6">
          <div>
            <p className="text-sm text-discret">Sillage des 30 derniers jours</p>
            <p className="mt-1 flex items-center gap-2 text-2xl">
              <Flame className={`size-6 ${t.serie > 0 ? "text-or" : "text-discret"}`} aria-hidden />
              <span className="font-mono tabular-nums">{t.serie}</span>
              <span className="text-base text-discret">jour{t.serie > 1 ? "s" : ""} d&apos;affilée</span>
            </p>
          </div>
          <p className="text-xs text-discret">Ruban épais = objectifs tenus · point doré = journée complète</p>
        </div>
        <Sillage valeurs={t.bilans.map((b) => b.progression)} atteints={t.bilans.map((b) => b.atteint)} className="h-28" />
      </Apparition>

      <div className="grid gap-4 sm:grid-cols-3">
        {t.bilan.objectifs.map((o, i) => (
          <Apparition key={o.cle} delai={0.08 + i * 0.05} className="carte p-5">
            <Anneau valeur={o.valeur} cible={o.cible} libelle={o.libelle} couleur={o.cle === "posts" ? "var(--lune)" : o.cle === "commits" ? "var(--balise)" : "var(--ecume)"} />
          </Apparition>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Apparition delai={0.1} className="carte p-6">
          <h2 className="flex items-center gap-2 font-medium">
            <BellRing className="size-4 text-balise" aria-hidden /> Relances dues
            <span className="ml-auto font-mono text-sm text-discret">{dues.length}</span>
          </h2>
          {dues.length === 0 ? (
            <p className="mt-3 text-sm text-discret">Aucune relance aujourd&apos;hui. Elles apparaîtront ici à J+5 puis J+7 ouvrés.</p>
          ) : (
            <ul className="mt-3 divide-y divide-ligne">
              {dues.map((c) => (
                <li key={c.id}>
                  <Link href={`/pipeline/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-ecume">
                    <span className="truncate">{nom(c.entrepriseId)}</span>
                    <span className={`shrink-0 font-mono text-xs ${c.prochaineRelance! < jour ? "text-balise" : "text-discret"}`}>
                      relance {c.relances + 1} · {c.prochaineRelance}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Apparition>

        <Apparition delai={0.14} className="carte p-6">
          <h2 className="flex items-center gap-2 font-medium">
            <Send className="size-4 text-ecume" aria-hidden /> Prêtes à partir
            <span className="ml-auto font-mono text-sm text-discret">{aEnvoyer.length}</span>
          </h2>
          {aEnvoyer.length === 0 ? (
            <p className="mt-3 text-sm text-discret">Les dossiers préparés par les agents arrivent ici, triés par pertinence.</p>
          ) : (
            <ul className="mt-3 divide-y divide-ligne">
              {aEnvoyer.slice(0, 8).map((c) => {
                const e = t.entreprises.find((x) => x.id === c.entrepriseId);
                return (
                  <li key={c.id}>
                    <Link href={`/pipeline/${c.id}`} className="group flex items-center justify-between gap-3 py-2.5 hover:text-ecume">
                      <span className="min-w-0">
                        <span className="block truncate">{e?.nom ?? c.entrepriseId}</span>
                        <span className="block truncate text-xs text-discret">{[e?.ville, e?.secteur].filter(Boolean).join(" · ")}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-discret">
                        {e?.score ?? "–"} <ArrowUpRight className="size-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Apparition>
      </div>

      <Apparition delai={0.16} className="carte p-6">
        <h2 className="flex items-center gap-2 font-medium">
          <Sparkles className="size-4 text-lune" aria-hidden /> LinkedIn du jour
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {(["matin", "midi", "soir"] as const).map((cr) => {
            const p = postsJour.find((x) => x.creneau === cr);
            return (
              <li key={cr}>
                <Link href="/linkedin" className={`block h-full rounded-xl border p-4 transition hover:border-lune ${p?.statut === "publie" ? "border-or/40" : p ? "border-ligne-forte" : "border-dashed border-ligne"}`}>
                  <p className="flex justify-between font-mono text-xs text-discret">
                    <span>{p?.heure || cr}</span>
                    <span>{p?.statut === "publie" ? "publié" : p ? "à publier" : "à écrire"}</span>
                  </p>
                  <p className="mt-1 text-sm text-lune">{CRENEAU[cr]}</p>
                  <p className="mt-2 line-clamp-3 text-sm">{p ? p.texte.split("\n")[0] : "Pas encore de brouillon."}</p>
                </Link>
              </li>
            );
          })}
        </ol>
      </Apparition>

      {rapport && (
        <Apparition delai={0.18} className="carte p-6">
          <h2 className="font-medium">
            Rapport des agents <span className="font-mono text-xs text-discret">· {rapport.date}</span>
          </h2>
          <div className="mt-2 max-h-[28rem] overflow-y-auto pr-2">
            <Markdown texte={rapport.resume} />
          </div>
          <Link href="/journal" className="mt-3 inline-block text-sm text-ecume hover:underline">
            Tout le journal
          </Link>
        </Apparition>
      )}
    </div>
  );
}
