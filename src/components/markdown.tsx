import { Fragment } from "react";

/**
 * Rendu markdown volontairement restreint (titres, listes, gras, code, liens
 * http) pour les rapports d'agents : pas de HTML brut, donc rien à assainir.
 */
function enLigne(t: string) {
  const morceaux = t.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g);
  return morceaux.map((m, i) => {
    if (m.startsWith("**") && m.endsWith("**")) return <strong key={i} className="font-semibold text-texte">{m.slice(2, -2)}</strong>;
    if (m.startsWith("`") && m.endsWith("`")) return <code key={i} className="rounded bg-surface-2 px-1 font-mono text-[0.9em]">{m.slice(1, -1)}</code>;
    const l = m.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (l) return <a key={i} href={l[2]} className="text-ecume underline-offset-2 hover:underline" rel="noreferrer" target="_blank">{l[1]}</a>;
    return <Fragment key={i}>{m}</Fragment>;
  });
}

export function Markdown({ texte }: { texte: string }) {
  const blocs: React.ReactNode[] = [];
  let liste: string[] = [];
  const viderListe = () => {
    if (liste.length) blocs.push(<ul key={blocs.length} className="my-2 list-disc space-y-1 pl-5">{liste.map((l, i) => <li key={i}>{enLigne(l)}</li>)}</ul>);
    liste = [];
  };
  for (const ligne of texte.split("\n")) {
    const li = ligne.match(/^\s*[-*]\s+(.*)/) ?? ligne.match(/^\s*\d+\.\s+(.*)/);
    if (li) { liste.push(li[1]); continue; }
    viderListe();
    const h = ligne.match(/^(#{1,4})\s+(.*)/);
    if (h) blocs.push(<p key={blocs.length} className={`mt-5 font-medium text-texte ${h[1].length <= 2 ? "text-lg" : "text-base"}`}>{enLigne(h[2])}</p>);
    else if (ligne.trim()) blocs.push(<p key={blocs.length} className="my-2">{enLigne(ligne)}</p>);
  }
  viderListe();
  return <div className="text-sm leading-relaxed text-discret">{blocs}</div>;
}
