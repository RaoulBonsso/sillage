import Link from "next/link";
import { ArrowLeft, ExternalLink, Landmark } from "lucide-react";
import { Apparition } from "@/components/apparition";
import { EFFECTIFS, liensOfficiels, SECTEURS } from "@/domaine/officiel";
import { rechercher } from "@/lib/officiel";
import { exigerSession } from "@/lib/serveur";
import { Ajout } from "./ajout";

export const metadata = { title: "Registres officiels" };

const euros = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(n));

export default async function Registres({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  const s = await exigerSession();
  const page = Math.max(1, Number(p.page) || 1);
  const effectifs = EFFECTIFS.find((e) => e.cle === p.taille)?.codes;
  const actif = !!(p.q?.trim() || p.dep || p.naf);
  let res: Awaited<ReturnType<typeof rechercher>> | null = null;
  let erreur = "";
  if (actif) {
    try {
      res = await rechercher({ q: p.q, departement: p.dep || undefined, naf: p.naf || undefined, effectifs, page });
    } catch (e) {
      erreur = (e as Error).message;
    }
  }
  const deja = new Set((await s.depot.entreprises.lister()).map((e) => e.id));
  const lien = (n: number) => `/cibles/registres?${new URLSearchParams({ ...(Object.fromEntries(Object.entries(p).filter(([, v]) => v)) as Record<string, string>), page: String(n) })}`;
  const champ = "rounded-xl border border-ligne-forte bg-surface px-3 py-2.5 text-sm outline-none focus:border-ecume";

  return (
    <div>
      <Link href="/cibles" className="inline-flex items-center gap-1.5 text-sm text-discret hover:text-texte">
        <ArrowLeft className="size-4" aria-hidden /> Cibles
      </Link>
      <Apparition>
        <h1 className="titre-display mt-3 text-4xl sm:text-5xl">Registres officiels</h1>
        <p className="mt-2 max-w-2xl text-discret">
          Les entreprises actives de France, telles que l&apos;INSEE (Sirene) et l&apos;INPI (registre national) les déclarent : effectif, dirigeants, comptes publiés.
          Source publique et gratuite : <a className="text-ecume hover:underline" href="https://recherche-entreprises.api.gouv.fr" target="_blank" rel="noreferrer">API Recherche d&apos;entreprises</a>.
        </p>
      </Apparition>

      <form className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_2fr_1.3fr_auto]" role="search">
        <label className="sr-only" htmlFor="q">Mots-clés</label>
        <input id="q" name="q" defaultValue={p.q} placeholder="Nom, activité, mot-clé…" className={champ} />
        <label className="sr-only" htmlFor="dep">Département</label>
        <input id="dep" name="dep" defaultValue={p.dep ?? "44"} placeholder="Dépt. (44)" inputMode="numeric" maxLength={3} className={champ} />
        <label className="sr-only" htmlFor="naf">Secteur</label>
        <select id="naf" name="naf" defaultValue={p.naf ?? ""} className={champ}>
          <option value="">Tous secteurs</option>
          {SECTEURS.map((x) => <option key={x.naf} value={x.naf}>{x.libelle} ({x.naf})</option>)}
        </select>
        <label className="sr-only" htmlFor="taille">Taille</label>
        <select id="taille" name="taille" defaultValue={p.taille ?? "pe"} className={champ}>
          <option value="">Toutes tailles</option>
          {EFFECTIFS.map((x) => <option key={x.cle} value={x.cle}>{x.libelle}</option>)}
        </select>
        <button className="rounded-xl bg-texte px-5 py-2.5 text-sm font-medium text-fond hover:bg-ecume">Chercher</button>
      </form>

      {erreur && <p role="alert" className="mt-6 rounded-xl bg-balise-doux px-4 py-3 text-sm text-balise">{erreur}</p>}
      {!actif && (
        <p className="mt-10 flex items-center justify-center gap-2 text-center text-discret">
          <Landmark className="size-4" aria-hidden /> Choisissez un secteur ou des mots-clés. Astuce : expertise comptable + 10–49 salariés en Loire-Atlantique.
        </p>
      )}

      {res && (
        <>
          <p className="mt-6 text-sm text-discret">{res.total.toLocaleString("fr-FR")} entreprises actives · page {page}</p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {res.fiches.map((f, i) => (
              <Apparition key={f.siren} delai={Math.min(i, 8) * 0.03}>
                <li className="carte flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-medium leading-snug">{f.nom}</h2>
                    <span className="puce shrink-0 !py-0 font-mono">{f.categorie || "—"}</span>
                  </div>
                  <p className="mt-1 text-xs text-discret">
                    {[f.ville && `${f.ville} (${f.codePostal})`, f.effectif, f.creation && `créée en ${f.creation.slice(0, 4)}`, SECTEURS.find((x) => x.naf === f.naf)?.libelle ?? f.naf].filter(Boolean).join(" · ")}
                  </p>
                  {f.dirigeants.length > 0 && (
                    <ul className="mt-3 space-y-0.5 text-sm">
                      {f.dirigeants.slice(0, 3).map((d) => (
                        <li key={d.nom + d.qualite}>
                          {d.nom} <span className="text-xs text-discret">— {d.qualite}</span>
                        </li>
                      ))}
                      {f.dirigeants.length > 3 && <li className="text-xs text-discret">+ {f.dirigeants.length - 3} autre(s)</li>}
                    </ul>
                  )}
                  {f.finances && (
                    <p className="mt-2 font-mono text-xs text-discret">
                      Comptes {f.finances.annee} · CA {euros(f.finances.ca)} · résultat {euros(f.finances.resultat)}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
                    <Ajout siren={f.siren} deja={deja.has(f.siren)} />
                    {liensOfficiels(f.siren).slice(0, 2).map((l) => (
                      <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-discret hover:text-ecume">
                        {l.titre} <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ))}
                  </div>
                </li>
              </Apparition>
            ))}
          </ul>
          <nav aria-label="Pages" className="mt-6 flex justify-between text-sm">
            {page > 1 ? <Link href={lien(page - 1)} className="text-ecume hover:underline">← Précédente</Link> : <span />}
            {page * 20 < res.total && <Link href={lien(page + 1)} className="text-ecume hover:underline">Suivante →</Link>}
          </nav>
        </>
      )}
    </div>
  );
}
