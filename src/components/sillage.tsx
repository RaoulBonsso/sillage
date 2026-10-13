"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { ruban } from "./trace";

/**
 * La signature visuelle : un ruban d'écume qui s'épaissit les jours tenus,
 * une balise qui pulse au bout — c'est aujourd'hui.
 */
export function Sillage({ valeurs, atteints = [], hauteur = 120, className = "" }: { valeurs: number[]; atteints?: boolean[]; hauteur?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const reduit = useReducedMotion();
  const L = 1000;
  const { contour, axe, points } = ruban(valeurs, L - 24, hauteur);
  const fin = points.at(-1);
  return (
    <svg viewBox={`-6 0 ${L} ${hauteur}`} className={`w-full ${className}`} preserveAspectRatio="none" role="img" aria-label="Sillage des derniers jours : plus le ruban est épais, plus les objectifs du jour ont été tenus.">
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="var(--ecume)" stopOpacity="0" />
          <stop offset="0.65" stopColor="var(--ecume)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--ecume)" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`l${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="var(--lune)" stopOpacity="0.1" />
          <stop offset="1" stopColor="var(--ecume)" />
        </linearGradient>
      </defs>
      <motion.path d={contour} fill={`url(#g${id})`} initial={reduit ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.3 }} />
      <motion.path
        d={axe}
        fill="none"
        stroke={`url(#l${id})`}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        initial={reduit ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      {points.map((p, i) =>
        atteints[i] ? <circle key={i} cx={p.x} cy={p.y - p.w - 6} r="2.4" fill="var(--or)" opacity="0.9" /> : null,
      )}
      {fin && (
        <motion.circle cx={fin.x} cy={fin.y} r="6" fill="var(--balise)" initial={reduit ? false : { scale: 0 }} animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 2.4, repeat: reduit ? 0 : Infinity, delay: 1.6 }} />
      )}
    </svg>
  );
}
