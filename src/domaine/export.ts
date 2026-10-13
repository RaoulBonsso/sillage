/** CSV au format Excel français (séparateur « ; », BOM UTF-8), protégé contre l'injection de formules. */
export function versCsv(entetes: string[], lignes: (string | number | null | undefined)[][]): string {
  const cellule = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [entetes, ...lignes].map((l) => l.map(cellule).join(";")).join("\r\n");
}
