import Link from "next/link";
import { ArrowRight, BadgeCheck, BellRing, FolderGit2, Hand, Plug } from "lucide-react";
import { Apparition } from "@/components/apparition";
import { Logo } from "@/components/logo";
import { Sillage } from "@/components/sillage";
import { ETAPES } from "@/domaine/types";
import { LIBELLES } from "@/domaine/pipeline";

const DEPOT = "https://github.com/RaoulBonsso/sillage";

// Forme décorative du héros (aucune donnée) : une houle qui s'amplifie.
const HOULE = Array.from({ length: 28 }, (_, i) => 0.15 + 0.85 * Math.pow(i / 27, 1.6) * (0.75 + 0.25 * Math.sin(i * 1.3)));

const JOURNEE = [
  { h: "07:30", t: "La chasse", d: "Un agent repère des entreprises qui travaillent encore au papier. Chaque signal a une source, chaque décideur aussi." },
  { h: "08:30", t: "Post du matin", d: "Une actualité tech ou IA, et ce qu'elle change concrètement pour une PME." },
  { h: "10:00", t: "Les dossiers", d: "CV ajusté au besoin de l'entreprise, lettre courte, e-mail nominatif, idée de mini-démo." },
  { h: "12:30", t: "Post de midi", d: "Le projet en cours : ce qui a été construit, ce qui a été appris." },
  { h: "14:00", t: "Envois et relances", d: "Un clic pour envoyer. Les relances tombent seules à J+5 puis J+7 ouvrés — fériés compris." },
  { h: "18:30", t: "Post du soir", d: "La valeur d'une solution, racontée côté client, sans chiffre inventé." },
  { h: "21:00", t: "Le rapport", d: "Ce qui a été fait, chez qui, ce qui reste. Et un commit public : le graphe reste vert." },
];

const PRINCIPES = [
  { i: BadgeCheck, t: "Rien d'inventé", d: "Un signal sans URL est refusé à l'entrée. Un e-mail déduit est marqué comme tel. Le CV ne réécrit que des faits." },
  { i: Hand, t: "L'humain signe", d: "Les agents préparent, vous envoyez. Aucun message ne part au nom de quelqu'un sans son clic." },
  { i: BellRing, t: "Rien ne s'oublie", d: "Le calendrier ouvré français calcule chaque relance. Ce qui attend une action pulse en corail." },
  { i: Plug, t: "Ouvert par construction", d: "Un serveur MCP expose tout : Claude Code, n8n ou votre propre agent pilotent Sillage avec les mêmes règles que l'interface." },
];

export default function Accueil() {
  return (
    <div className="relative">
      <header className="sticky top-0 z-40 border-b border-ligne bg-fond/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Navigation principale">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Logo /> Sillage
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <a href={DEPOT} className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-discret transition hover:text-texte sm:inline-flex">
              <FolderGit2 className="size-4" aria-hidden /> Code source
            </a>
            <Link href="/connexion" className="rounded-full bg-texte px-4 py-1.5 font-medium text-fond transition hover:bg-ecume">
              Mon espace
            </Link>
          </div>
        </nav>
      </header>

      <main id="contenu">
        <section className="halo relative overflow-hidden">
          <div className="grille-points pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-20 sm:px-6 sm:pt-28">
            <Apparition>
              <p className="puce mb-6">
                <span className="size-1.5 rounded-full bg-ecume" aria-hidden /> Open source · MCP natif · fait à Nantes
              </p>
              <h1 className="titre-display max-w-4xl text-5xl sm:text-7xl md:text-8xl">
                Chaque jour, une trace <em className="text-ecume">qui avance.</em>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-discret">
                Sillage est le poste de pilotage d&apos;une recherche d&apos;alternance ou d&apos;emploi. Des agents cherchent et préparent, vous décidez et
                envoyez, rien ne s&apos;oublie. Le résultat : une candidature sérieuse par heure, trois posts LinkedIn par jour, et un historique net de
                chaque échange.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/connexion" className="group inline-flex items-center gap-2 rounded-full bg-ecume px-6 py-3 font-medium text-[#00110d] transition hover:brightness-110">
                  Ouvrir mon espace <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <a href="#mcp" className="inline-flex items-center gap-2 rounded-full border border-ligne-forte px-6 py-3 transition hover:border-ecume hover:text-ecume">
                  Brancher un agent
                </a>
              </div>
            </Apparition>
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6" aria-hidden>
            <Sillage valeurs={HOULE} hauteur={140} className="h-28 sm:h-36" />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Apparition>
            <h2 className="titre-display text-4xl sm:text-5xl">Une journée type.</h2>
            <p className="mt-3 max-w-xl text-discret">Trois engagements quotidiens : des candidatures envoyées, trois posts, une contribution publique. Le sillage s&apos;épaissit les jours tenus.</p>
          </Apparition>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-ligne bg-ligne sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEE.map((e, i) => (
              <li key={e.h} className={`bg-surface p-6 ${i === JOURNEE.length - 1 ? "lg:col-span-2" : ""}`}>
                <Apparition delai={i * 0.05}>
                  <p className="font-mono text-sm text-ecume">{e.h}</p>
                  <h3 className="mt-2 text-lg font-medium">{e.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-discret">{e.d}</p>
                </Apparition>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-ligne bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Apparition>
              <h2 className="titre-display text-4xl sm:text-5xl">Un pipeline qui dit la vérité.</h2>
              <p className="mt-3 max-w-xl text-discret">
                Chaque candidature suit des transitions contrôlées. Impossible de relancer ce qui n&apos;a pas été envoyé, impossible de perdre la date d&apos;un
                échange.
              </p>
            </Apparition>
            <div className="mt-10 flex flex-wrap items-center gap-2">
              {ETAPES.filter((e) => e !== "close").map((e, i) => (
                <Apparition key={e} delai={i * 0.06} className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-4 py-2 text-sm ${e === "signee" ? "border-or/50 bg-or/10 text-or" : e === "refusee" ? "border-ligne text-discret" : e === "relancee" ? "border-balise/40 bg-balise-doux text-balise" : "border-ecume/30 bg-ecume-doux text-ecume"}`}
                  >
                    {LIBELLES[e]}
                  </span>
                  {i < 7 && <ArrowRight className="size-3.5 text-discret" aria-hidden />}
                </Apparition>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {PRINCIPES.map(({ i: Icone, t, d }, k) => (
              <Apparition key={t} delai={k * 0.06} className="carte p-7">
                <Icone className="size-6 text-ecume" aria-hidden />
                <h3 className="mt-4 text-xl font-medium">{t}</h3>
                <p className="mt-2 leading-relaxed text-discret">{d}</p>
              </Apparition>
            ))}
          </div>
        </section>

        <section id="mcp" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 sm:px-6">
          <Apparition className="carte overflow-hidden">
            <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-2">
              <div>
                <p className="puce">Model Context Protocol</p>
                <h2 className="titre-display mt-4 text-4xl">Vos agents, nos règles.</h2>
                <p className="mt-3 leading-relaxed text-discret">
                  Douze outils couvrent tout le cycle : chercher dans les registres officiels, lister et ajouter des cibles, préparer un dossier, faire avancer une candidature, obtenir les
                  relances dues, déposer un post, écrire le rapport du jour. Une clé par espace, révocable.
                </p>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-ligne bg-fond p-5 font-mono text-[13px] leading-relaxed text-discret">
                <code>
                  <span className="text-ecume">claude mcp add</span> --transport http sillage \{"\n"}
                  {"  "}https://sillage-raoul.vercel.app/api/mcp \{"\n"}
                  {"  "}--header <span className="text-or">&quot;Authorization: Bearer $SILLAGE_CLE&quot;</span>
                  {"\n\n"}
                  <span className="text-lune"># puis, dans Claude Code :</span>
                  {"\n"}&gt; Quelles relances sont dues aujourd&apos;hui ?
                </code>
              </pre>
            </div>
          </Apparition>
        </section>
      </main>

      <footer className="border-t border-ligne">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-discret sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2">
            <Logo className="size-5" /> Sillage — conçu et construit par{" "}
            <a className="text-texte hover:text-ecume" href="https://github.com/RaoulBonsso">
              Raoul Bonsso
            </a>
          </p>
          <p>
            Licence MIT ·{" "}
            <a className="hover:text-ecume" href={DEPOT}>
              github.com/RaoulBonsso/sillage
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
