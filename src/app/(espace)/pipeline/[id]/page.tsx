import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, Mail, UserRound } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { LIBELLES, transitionsPossibles } from "@/domaine/pipeline";
import { aujourdhui, exigerSession } from "@/lib/serveur";
import { changerEtape, noter } from "../../actions";
import { Envoi } from "./envoi";
import { Onglets } from "./onglets";
import { FicheOfficielle } from "./fiche-officielle";
import { Suspense } from "react";

const RELANCE = (nom: string, objet: string) =>
  `Bonjour${nom ? ` ${nom}` : ""},\n\nJe me permets de revenir vers vous au sujet de ma candidature en alternance (« ${objet} »).\n\nJe pense toujours pouvoir vous être utile rapidement, et vous présenter en 15 minutes la petite démonstration évoquée serait un plaisir.\n\nBien cordialement,\n${process.env.SILLAGE_EXPEDITEUR ?? ""}`;

export default async function Fiche({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await exigerSession();
  const c = await s.depot.candidatures.lire(decodeURIComponent(id));
  if (!c) notFound();
  const e = await s.depot.entreprises.lire(c.entrepriseId);
  const contact = e?.contacts[c.contactIndex];
  const jour = aujourdhui();
  const relance = c.etape === "envoyee" || c.etape === "relancee";
  const peutEnvoyer = c.etape === "preparee" || relance;
  const manuelles = transitionsPossibles(c.etape).filter((x) => x !== "relancee");

  return (
    <div className="space-y-6">
      <Link href="/pipeline" className="inline-flex items-center gap-1.5 text-sm text-discret hover:text-texte">
        <ArrowLeft className="size-4" aria-hidden /> Candidatures
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="puce">{LIBELLES[c.etape]}</p>
          <h1 className="titre-display mt-3 text-4xl sm:text-5xl">{e?.nom ?? c.entrepriseId}</h1>
          <p className="mt-2 text-discret">{[e?.ville, e?.secteur, e?.effectif && `${e.effectif} salariés`].filter(Boolean).join(" · ")}</p>
        </div>
        {e && (
          <div className="text-right">
            <p className="font-mono text-4xl tabular-nums text-ecume">{e.score}</p>
            <p className="text-xs text-discret">pertinence</p>
          </div>
        )}
      </header>

      {c.prochaineRelance && (
        <p className={`rounded-xl px-4 py-3 text-sm ${c.prochaineRelance <= jour ? "bg-balise-doux text-balise" : "bg-surface text-discret"}`}>
          Relance {c.relances + 1} prévue le <span className="font-mono">{c.prochaineRelance}</span>
          {c.prochaineRelance <= jour ? " — c'est le moment." : "."}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="carte min-w-0 p-6">
          <Onglets
            onglets={[
              ...(peutEnvoyer
                ? [
                    {
                      id: "envoi",
                      titre: relance ? "Relancer" : "Envoyer",
                      contenu: (
                        <Envoi
                          id={c.id}
                          a={contact?.email ?? ""}
                          objet={relance ? `Re: ${c.dossier.email.objet}` : c.dossier.email.objet}
                          texte={relance ? RELANCE(contact?.nom ?? "", c.dossier.email.objet) : c.dossier.email.corps}
                          relance={relance}
                          avecCv={!!c.dossier.cv || !!(await s.depot.fichiers.lire("cv-principal.pdf"))}
                        />
                      ),
                    },
                  ]
                : []),
              { id: "lettre", titre: "Lettre", contenu: <Markdown texte={c.dossier.lettre || "_Pas de lettre._"} /> },
              { id: "demo", titre: "Mini-projet", contenu: <Markdown texte={c.dossier.miniProjet || "_Pas de mini-projet._"} /> },
              {
                id: "historique",
                titre: `Historique (${c.historique.length})`,
                contenu: (
                  <div>
                    <ol className="relative space-y-4 border-l border-ligne pl-5">
                      {[...c.historique].reverse().map((h, i) => (
                        <li key={i} className="relative">
                          <span className={`absolute -left-[25px] top-1.5 size-2.5 rounded-full ${h.type === "note" ? "bg-lune" : h.type === "relance" ? "bg-balise" : "bg-ecume"}`} aria-hidden />
                          <p className="font-mono text-xs text-discret">
                            {new Date(h.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" })} · {h.auteur}
                          </p>
                          <p className="mt-0.5 text-sm">{h.texte}</p>
                        </li>
                      ))}
                    </ol>
                    <form action={noter.bind(null, c.id)} className="mt-6 flex gap-2">
                      <label htmlFor="note" className="sr-only">Ajouter une note</label>
                      <input id="note" name="texte" placeholder="Appel, réponse LinkedIn, info utile…" className="min-w-0 flex-1 rounded-xl border border-ligne-forte bg-fond px-3 py-2 text-sm outline-none focus:border-ecume" />
                      <button className="rounded-xl border border-ligne-forte px-4 text-sm hover:border-ecume hover:text-ecume">Noter</button>
                    </form>
                  </div>
                ),
              },
            ]}
          />
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="carte p-5">
            <h2 className="text-sm font-medium">Pourquoi eux</h2>
            {e && (
              <p className="mt-2 text-sm leading-relaxed text-discret">
                {e.signal.texte}{" "}
                <a href={e.signal.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-ecume hover:underline">
                  source <ExternalLink className="size-3" aria-hidden />
                </a>
              </p>
            )}
            {e?.angle && <p className="mt-3 border-t border-ligne pt-3 text-sm leading-relaxed">{e.angle}</p>}
            {e?.site && (
              <a href={e.site} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-discret hover:text-ecume">
                {e.site.replace(/^https?:\/\//, "").replace(/\/$/, "")} <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
          </div>

          <div className="carte p-5">
            <h2 className="text-sm font-medium">Contacts</h2>
            <ul className="mt-3 space-y-3">
              {e?.contacts.map((k, i) => (
                <li key={i} className={`rounded-xl border p-3 text-sm ${i === c.contactIndex ? "border-ecume/40" : "border-ligne"}`}>
                  <p className="font-medium">{k.nom}</p>
                  <p className="text-xs text-discret">{k.role}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {k.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3" aria-hidden /> {k.email}
                        {k.confiance === "devine" && <span className="text-balise">(déduit)</span>}
                      </span>
                    )}
                    {k.linkedin && (
                      <a href={k.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ecume hover:underline">
                        <UserRound className="size-3" aria-hidden /> profil
                      </a>
                    )}
                    {k.source && (
                      <a href={k.source} target="_blank" rel="noreferrer" className="text-discret hover:text-texte">
                        source
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Suspense fallback={<div className="carte h-40 animate-pulse" aria-hidden />}>
            <FicheOfficielle siren={c.entrepriseId} />
          </Suspense>

          {c.dossier.cv && (
            <a href={`/fichier/${encodeURIComponent(c.dossier.cv)}`} target="_blank" className="carte flex items-center gap-3 p-4 text-sm hover:border-ecume">
              <FileText className="size-5 text-ecume" aria-hidden /> CV adapté (PDF)
            </a>
          )}

          {manuelles.length > 0 && (
            <div className="carte p-5">
              <h2 className="text-sm font-medium">Faire avancer</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {manuelles.map((x) => (
                  <form key={x} action={changerEtape.bind(null, c.id, x, "")}>
                    <button className={`rounded-full border px-3 py-1.5 text-xs transition ${x === "signee" ? "border-or/50 text-or hover:bg-or/10" : x === "refusee" || x === "close" ? "border-ligne text-discret hover:text-texte" : "border-ligne-forte hover:border-ecume hover:text-ecume"}`}>
                      {x === "envoyee" ? "Marquer envoyée (autre canal)" : LIBELLES[x]}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
