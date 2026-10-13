import { describe, expect, it } from "vitest";
import { activiteParJour } from "./lecture";
import { avancer, nouvelleCandidature } from "@/domaine/pipeline";
import type { Post } from "@/domaine/types";

const d = { cv: "", lettre: "", email: { objet: "", corps: "" }, miniProjet: "" };

describe("activiteParJour", () => {
  it("déduit l'activité des historiques, des posts et des contributions", () => {
    const c = avancer(nouvelleCandidature("a", d, "2026-10-12T08:00:00Z"), "envoyee", "2026-10-13T09:00:00Z");
    const r = avancer(c, "relancee", "2026-10-20T09:00:00Z");
    const p = { id: "x", statut: "publie", publieLe: "2026-10-13T12:31:00Z" } as Post;
    const a = activiteParJour([r], [p], { "2026-10-13": 4 });
    expect(a["2026-10-13"]).toEqual({ candidatures: 1, posts: 1, commits: 4 });
    expect(a["2026-10-20"]).toEqual({ candidatures: 1, posts: 0, commits: 0 });
  });
});
