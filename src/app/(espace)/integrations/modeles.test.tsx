import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MODELES_PAR_DEFAUT } from "@/domaine/modeles";
import { enregistrerModelesRelance } from "../actions";
import { Modeles } from "./modeles";

vi.mock("../actions", () => ({ enregistrerModelesRelance: vi.fn() }));
const action = vi.mocked(enregistrerModelesRelance);

beforeEach(() => {
  action.mockReset();
});

const afficher = () => render(<Modeles modeles={MODELES_PAR_DEFAUT} />);
const enregistrer = () => fireEvent.click(screen.getByRole("button", { name: /enregistrer les modèles/i }));

describe("Modeles", () => {
  it("préremplit un objet et un message par relance", () => {
    afficher();
    expect(screen.getAllByLabelText("Objet")).toHaveLength(2);
    expect(screen.getAllByLabelText("Message")[1]).toHaveValue(MODELES_PAR_DEFAUT[1].corps);
  });

  it("envoie les textes modifiés et confirme", async () => {
    action.mockResolvedValue({ ok: true, modeles: [...MODELES_PAR_DEFAUT] });
    afficher();
    fireEvent.change(screen.getAllByLabelText("Objet")[1], { target: { value: "Dernier mot" } });
    enregistrer();
    expect(await screen.findByRole("status")).toHaveTextContent("Modèles enregistrés.");
    const form = action.mock.calls[0][0];
    expect(form.get("objet-0")).toBe(MODELES_PAR_DEFAUT[0].objet);
    expect(form.get("objet-1")).toBe("Dernier mot");
  });

  it("affiche l'erreur de validation et garde la saisie", async () => {
    action.mockResolvedValue({ ok: false, erreur: "Relance 1 : L'objet est requis." });
    afficher();
    fireEvent.change(screen.getAllByLabelText("Objet")[0], { target: { value: " " } });
    enregistrer();
    expect(await screen.findByRole("alert")).toHaveTextContent("Relance 1 : L'objet est requis.");
    expect(screen.getAllByLabelText("Objet")[0]).toHaveValue(" ");
  });
});
