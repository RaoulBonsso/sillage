/** Limitation de débit à fenêtre fixe, en mémoire. Pure : l'horloge est injectée. */
export type Verdict = { autorise: true } | { autorise: false; reessayerDansS: number };

export function creerLimiteur(opts: { max: number; fenetreMs: number; maintenant?: () => number }) {
  const maintenant = opts.maintenant ?? Date.now;
  const fenetres = new Map<string, { debut: number; n: number }>();

  return {
    essayer(cle: string): Verdict {
      const t = maintenant();
      for (const [k, f] of fenetres) if (t - f.debut >= opts.fenetreMs) fenetres.delete(k);
      const f = fenetres.get(cle);
      if (!f) {
        fenetres.set(cle, { debut: t, n: 1 });
        return { autorise: true };
      }
      if (f.n < opts.max) {
        f.n += 1;
        return { autorise: true };
      }
      return { autorise: false, reessayerDansS: Math.ceil((f.debut + opts.fenetreMs - t) / 1000) };
    },
    taille: () => fenetres.size,
  };
}
