"use client";

import { motion, useReducedMotion } from "motion/react";

export function Anneau({ valeur, cible, libelle, couleur = "var(--ecume)" }: { valeur: number; cible: number; libelle: string; couleur?: string }) {
  const reduit = useReducedMotion();
  const p = Math.min(1, valeur / Math.max(1, cible));
  const fait = valeur >= cible;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 44 44" className="size-16 shrink-0 -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--ligne-forte)" strokeWidth="4" />
        <motion.circle cx="22" cy="22" r="18" fill="none" stroke={fait ? "var(--or)" : couleur} strokeWidth="4" strokeLinecap="round" initial={reduit ? false : { pathLength: 0 }} animate={{ pathLength: p }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div>
        <p className="font-mono text-2xl tabular-nums">
          {valeur}
          <span className="text-base text-discret">/{cible}</span>
        </p>
        <p className="text-sm text-discret">{libelle}</p>
      </div>
    </div>
  );
}
