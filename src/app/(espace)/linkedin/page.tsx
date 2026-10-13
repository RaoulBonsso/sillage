import Link from "next/link";
import { Apparition } from "@/components/apparition";
import { derniersJours } from "@/lib/donnees";
import { aujourdhui, exigerSession } from "@/lib/serveur";
import { Editeur } from "./editeur";

export const metadata = { title: "LinkedIn" };

const CRENEAUX = [
  { cle: "matin", heure: "08:30", titre: "Actualité", aide: "Une actu tech/IA récente et sourcée, et ce qu'elle change pour une PME." },
  { cle: "midi", heure: "12:30", titre: "Projet", aide: "Le projet en cours : ce qui a été construit, appris, décidé." },
  { cle: "soir", heure: "18:30", titre: "Valeur", aide: "Ce qu'une solution apporte concrètement à ses utilisateurs." },
] as const;

export default async function LinkedIn({ searchParams }: { searchParams: Promise<{ jour?: string }> }) {
  const s = await exigerSession();
  const auj = aujourdhui();
  const { jour = auj } = await searchParams;
  const posts = await s.depot.posts.lister();
  const semaine = derniersJours(auj, 7);
  const publies = posts.filter((p) => p.statut === "publie").length;
  const auteur = process.env.SILLAGE_EXPEDITEUR ?? s.email.split("@")[0];

  return (
    <div>
      <Apparition>
        <h1 className="titre-display text-4xl sm:text-5xl">LinkedIn</h1>
        <p className="mt-2 text-discret">Trois rendez-vous par jour. {publies} posts publiés au total.</p>
      </Apparition>

      <nav aria-label="Jours" className="mt-6 grid grid-cols-7 gap-1.5">
        {semaine.map((j) => {
          const duJour = posts.filter((p) => p.date === j);
          return (
            <Link key={j} href={`/linkedin?jour=${j}`} aria-current={j === jour ? "date" : undefined} className={`rounded-xl border p-2 text-center transition ${j === jour ? "border-lune bg-surface-2" : "border-ligne hover:border-ligne-forte"}`}>
              <span className="block text-[11px] capitalize text-discret">{new Date(`${j}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short" })}</span>
              <span className="block font-mono text-sm">{j.slice(8)}</span>
              <span className="mt-1.5 flex justify-center gap-1" aria-label={`${duJour.filter((p) => p.statut === "publie").length} publiés sur 3`}>
                {CRENEAUX.map((c) => {
                  const p = duJour.find((x) => x.creneau === c.cle);
                  return <span key={c.cle} className={`size-1.5 rounded-full ${p?.statut === "publie" ? "bg-or" : p ? "bg-lune" : "bg-ligne-forte"}`} />;
                })}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 space-y-6">
        {CRENEAUX.map((c, i) => {
          const p = posts.find((x) => x.date === jour && x.creneau === c.cle);
          return (
            <Apparition key={c.cle} delai={i * 0.05} className="carte p-6">
              <h2 className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-mono text-sm text-lune">{p?.heure || c.heure}</span>
                <span className="titre-display text-2xl">{c.titre}</span>
                {p?.titre && <span className="text-sm text-discret">— {p.titre}</span>}
              </h2>
              <div className="mt-4">{p ? <Editeur post={p} auteur={auteur} /> : <p className="text-sm text-discret">Pas encore de brouillon. {c.aide}</p>}</div>
            </Apparition>
          );
        })}
      </div>
    </div>
  );
}
