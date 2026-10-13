import { Apparition } from "@/components/apparition";
import { Markdown } from "@/components/markdown";
import { exigerSession } from "@/lib/serveur";

export const metadata = { title: "Journal" };

export default async function Journal() {
  const s = await exigerSession();
  const rapports = (await s.depot.rapports.lister()).sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div>
      <Apparition>
        <h1 className="titre-display text-4xl sm:text-5xl">Journal de bord</h1>
        <p className="mt-2 text-discret">Chaque soir, les agents consignent ce qu&apos;ils ont fait, chez qui, et ce qui reste à décider.</p>
      </Apparition>
      <ol className="mt-8 space-y-4">
        {rapports.map((r, i) => (
          <Apparition key={r.id} delai={Math.min(i, 5) * 0.05}>
            <li className="carte p-6">
              <details open={i === 0}>
                <summary className="cursor-pointer list-none">
                  <p className="flex items-center justify-between">
                    <span className="titre-display text-2xl capitalize">{new Date(`${r.date}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
                    <span className="font-mono text-xs text-discret">{r.auteur}</span>
                  </p>
                </summary>
                <div className="mt-3">
                  <Markdown texte={r.resume} />
                </div>
              </details>
            </li>
          </Apparition>
        ))}
      </ol>
      {rapports.length === 0 && <p className="mt-10 text-center text-discret">Le premier rapport arrivera ce soir.</p>}
    </div>
  );
}
