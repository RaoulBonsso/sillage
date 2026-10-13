/**
 * Lit un e-mail rédigé par un agent (email.md) :
 *   **Objet :** …   puis le corps après une ligne `---`.
 * Sans séparateur, tout ce qui suit l'en-tête est le corps.
 * @param {string} md
 * @returns {{ objet: string, corps: string }}
 */
export function lireEmail(md) {
  const objet = md.match(/^\**\s*Objet\s*:?\**\s*:?\s*(.+)$/im)?.[1]?.replace(/\*+/g, "").trim() ?? "";
  const parties = md.split(/^-{3,}\s*$/m);
  let corps = parties.length > 1 ? parties.slice(1).join("---") : md.replace(/^#.*$/m, "").replace(/^\*\*[^*]+\*\*.*$/gm, "");
  corps = corps.replace(/\r/g, "").trim();
  return { objet, corps };
}
