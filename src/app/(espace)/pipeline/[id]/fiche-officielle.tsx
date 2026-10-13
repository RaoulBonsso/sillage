import { ExternalLink, Landmark } from "lucide-react";
import { liensOfficiels } from "@/domaine/officiel";
import { annonces, fiche } from "@/lib/officiel";

const euros = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(n));

/** Ce que disent les registres publics : à relire avant un entretien. */
export async function FicheOfficielle({ siren }: { siren: string }) {
  if (!/^\d{9}$/.test(siren)) return null;
  const [f, a] = await Promise.all([fiche(siren).catch(() => null), annonces(siren, 3)]);
  return (
    <div className="carte p-5">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <Landmark className="size-4 text-lune" aria-hidden /> Registres officiels
      </h2>
      {f ? (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-discret">Effectif</dt><dd>{f.effectif}</dd>
          <dt className="text-discret">Création</dt><dd>{f.creation ? new Date(f.creation).toLocaleDateString("fr-FR") : "—"}</dd>
          <dt className="text-discret">Siège</dt><dd className="min-w-0 break-words">{f.adresse || "—"}</dd>
          {f.finances && (<><dt className="text-discret">Comptes {f.finances.annee}</dt><dd>CA {euros(f.finances.ca)} · résultat {euros(f.finances.resultat)}</dd></>)}
          {f.dirigeants.length > 0 && (<><dt className="text-discret">Dirigeants</dt><dd>{f.dirigeants.slice(0, 4).map((d) => `${d.nom} (${d.qualite})`).join(", ")}</dd></>)}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-discret">Registres momentanément injoignables.</p>
      )}
      {a.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-ligne pt-3 text-xs">
          {a.map((x) => (
            <li key={x.url}>
              <a href={x.url} target="_blank" rel="noreferrer" className="text-discret hover:text-ecume">
                <span className="font-mono">{x.date}</span> · {x.famille}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {liensOfficiels(siren).map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ecume hover:underline">
            {l.titre} <ExternalLink className="size-3" aria-hidden />
          </a>
        ))}
      </div>
    </div>
  );
}
