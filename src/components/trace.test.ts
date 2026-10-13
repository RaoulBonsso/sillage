import { describe, expect, it } from "vitest";
import { courbe, ruban } from "./trace";

describe("trace du sillage", () => {
  it("une courbe commence au premier point et finit au dernier", () => {
    const d = courbe([{ x: 0, y: 0 }, { x: 10, y: 5 }, { x: 20, y: 0 }]);
    expect(d.startsWith("M0.0,0.0")).toBe(true);
    expect(d.endsWith("20.0,0.0")).toBe(true);
  });
  it("le ruban s'épaissit avec la progression et reste fermé", () => {
    const r = ruban([0, 1], 100, 60);
    expect(r.points[1].w).toBeGreaterThan(r.points[0].w);
    expect(r.contour.trim().endsWith("Z")).toBe(true);
  });
  it("borne les valeurs hors [0,1]", () => {
    const r = ruban([-3, 7], 100, 60, 10);
    expect(r.points[0].w).toBe(1.5);
    expect(r.points[1].w).toBe(11.5);
  });
});
