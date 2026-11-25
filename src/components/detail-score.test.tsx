import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DetailScore } from "./detail-score";
import type { ScoreExplique } from "@/domaine/score";

const score: ScoreExplique = {
  total: 40,
  criteres: [
    { cle: "signal", libelle: "Signal", points: 30, max: 30, raison: "Signal d'embauche ou de besoin, sourcé" },
    { cle: "contact", libelle: "Contact", points: 0, max: 25, raison: "Aucun contact identifié" },
    { cle: "site", libelle: "Site", points: 10, max: 10, raison: "Site web renseigné" },
  ],
};

describe("DetailScore", () => {
  it("affiche chaque critère avec ses points, son maximum et sa raison", () => {
    render(<DetailScore score={score} />);
    expect(screen.getByText("Signal")).toBeInTheDocument();
    expect(screen.getByText("30 / 30")).toBeInTheDocument();
    expect(screen.getByText("0 / 25")).toBeInTheDocument();
    expect(screen.getByText("Aucun contact identifié")).toBeInTheDocument();
  });

  it("annonce le total sur 100 dans le résumé", () => {
    render(<DetailScore score={score} />);
    expect(screen.getByText(/40 \/ 100/)).toBeInTheDocument();
  });
});
