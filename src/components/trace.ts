/** Géométrie du sillage : un ruban dont l'épaisseur suit la progression de chaque jour. */

export interface Point {
  x: number;
  y: number;
}

/** Courbe lisse passant par les points (Catmull-Rom → Bézier cubiques). */
export function courbe(p: Point[]): string {
  if (p.length === 0) return "";
  if (p.length === 1) return `M${p[0].x},${p[0].y}`;
  let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i];
    const b = p[i];
    const c = p[i + 1];
    const e = p[i + 2] ?? c;
    const c1 = { x: b.x + (c.x - a.x) / 6, y: b.y + (c.y - a.y) / 6 };
    const c2 = { x: c.x - (e.x - b.x) / 6, y: c.y - (e.y - b.y) / 6 };
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`;
  }
  return d;
}

export function ruban(valeurs: number[], largeur: number, hauteur: number, epaisseurMax = 18) {
  const n = Math.max(2, valeurs.length);
  const pas = largeur / (n - 1);
  const milieu = hauteur / 2;
  const centre = (i: number) => milieu + Math.sin(i * 0.55) * hauteur * 0.12;
  const pts = valeurs.map((v, i) => ({ x: i * pas, y: centre(i), w: 1.5 + Math.max(0, Math.min(1, v)) * epaisseurMax }));
  const haut = pts.map((p) => ({ x: p.x, y: p.y - p.w }));
  const bas = pts.map((p) => ({ x: p.x, y: p.y + p.w })).reverse();
  const contour = `${courbe(haut)} L${bas[0].x.toFixed(1)},${bas[0].y.toFixed(1)} ${courbe(bas).slice(1)} Z`;
  return { contour, axe: courbe(pts), points: pts };
}
