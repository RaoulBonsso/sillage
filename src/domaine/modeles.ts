/** Un modèle d'e-mail de relance : objet et corps, avec des variables `{{nom}}`. */
export interface ModeleEmail {
  objet: string;
  corps: string;
}

export const VARIABLES = ["contact", "entreprise", "objet", "signature"] as const;
export type Variable = (typeof VARIABLES)[number];

/** Un modèle par rang de relance : le premier à J+5, le second ensuite. */
export const MODELES_PAR_DEFAUT: readonly ModeleEmail[] = [
  {
    objet: "Re: {{objet}}",
    corps:
      "Bonjour {{contact}},\n\nJe me permets de revenir vers vous au sujet de ma candidature en alternance (« {{objet}} »).\n\nJe pense toujours pouvoir vous être utile rapidement, et vous présenter en 15 minutes la petite démonstration évoquée serait un plaisir.\n\nBien cordialement,\n{{signature}}",
  },
  {
    objet: "Re: {{objet}}",
    corps:
      "Bonjour {{contact}},\n\nUn dernier mot au sujet de ma candidature en alternance (« {{objet}} »).\n\nSi le moment n'est pas le bon, une réponse même brève m'aiderait ; sinon, je reste disponible pour un échange de 15 minutes.\n\nBien cordialement,\n{{signature}}",
  },
];

const VARIABLE = /\{\{\s*(\w+)\s*\}\}/g;
const connue = (nom: string): nom is Variable => (VARIABLES as readonly string[]).includes(nom);

/** Le modèle de la prochaine relance ; au-delà du dernier rang, le dernier modèle sert encore. */
export function modeleDeRelance(relancesEnvoyees: number, modeles: readonly ModeleEmail[] = MODELES_PAR_DEFAUT): ModeleEmail {
  return modeles[Math.min(relancesEnvoyees, modeles.length - 1)];
}

/** Remplit les variables en une seule passe : une valeur n'est jamais réinterprétée. */
export function remplirModele(m: ModeleEmail, valeurs: Record<Variable, string>): ModeleEmail {
  const remplir = (texte: string) =>
    texte
      // Une variable vide avant une virgule emporte l'espace : « Bonjour, » et non « Bonjour , ».
      .replace(/[ \t]*\{\{\s*(\w+)\s*\}\}(?=,)/g, (bloc, nom: string) => (connue(nom) && valeurs[nom] === "" ? "" : bloc))
      .replace(VARIABLE, (bloc, nom: string) => (connue(nom) ? valeurs[nom] : bloc));
  return { objet: remplir(m.objet), corps: remplir(m.corps) };
}

export type LectureModeles = { ok: true; modeles: ModeleEmail[] } | { ok: false; erreur: string };

/** Valide un jeu complet de modèles (un par rang), venu d'un formulaire ou d'une sauvegarde. */
export function lireModeles(valeur: unknown): LectureModeles {
  const rangs = MODELES_PAR_DEFAUT.length;
  const forme = { ok: false, erreur: `Il faut un objet et un message pour chacune des ${rangs} relances.` } as const;
  if (!Array.isArray(valeur) || valeur.length !== rangs) return forme;
  const modeles: ModeleEmail[] = [];
  for (const [i, brut] of valeur.entries()) {
    const { objet, corps } = (brut ?? {}) as Partial<Record<keyof ModeleEmail, unknown>>;
    if (typeof objet !== "string" || typeof corps !== "string") return forme;
    const modele = { objet, corps: corps.replace(/\r\n/g, "\n") };
    const erreur = validerModele(modele);
    if (erreur) return { ok: false, erreur: `Relance ${i + 1} : ${erreur}` };
    modeles.push(modele);
  }
  return { ok: true, modeles };
}

/** Message d'erreur si le modèle ne peut pas être enregistré, sinon null. */
export function validerModele(m: ModeleEmail): string | null {
  if (m.objet.trim() === "") return "L'objet est requis.";
  if (m.corps.trim() === "") return "Le message est requis.";
  for (const texte of [m.objet, m.corps]) {
    for (const [bloc, nom] of texte.matchAll(VARIABLE)) {
      if (!connue(nom)) return `Variable inconnue : ${bloc}.`;
    }
    if (/\{\{|\}\}/.test(texte.replace(VARIABLE, ""))) return "Accolades mal formées.";
  }
  return null;
}
