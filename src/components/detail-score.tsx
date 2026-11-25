import type { ScoreExplique } from "@/domaine/score";

/** Détail du score d'une cible : un critère par ligne, points, maximum et raison. */
export function DetailScore({ score }: { score: ScoreExplique }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-discret hover:text-ecume">
        Détail du score ({score.total} / 100)
      </summary>
      <ul className="mt-2 space-y-2">
        {score.criteres.map((c) => (
          <li key={c.cle}>
            <div className="flex items-baseline justify-between gap-3">
              <span>{c.libelle}</span>
              <span className="font-mono text-xs tabular-nums">{`${c.points} / ${c.max}`}</span>
            </div>
            <p className="text-xs text-discret">{c.raison}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
