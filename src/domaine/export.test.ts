import { describe, expect, it } from "vitest";
import { versCsv } from "./export";

describe("versCsv", () => {
  it("échappe guillemets, points-virgules et retours à la ligne, avec BOM pour Excel", () => {
    const csv = versCsv(["a", "b"], [["x;y", 'il a dit "oui"'], ["ligne\nsuivante", null]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('"x;y";"il a dit ""oui"""');
    expect(csv).toContain('"ligne\nsuivante";');
  });
  it("neutralise les formules (injection CSV)", () => {
    expect(versCsv(["a"], [["=HYPERLINK(1)"]])).toContain("'=HYPERLINK(1)");
  });
});
