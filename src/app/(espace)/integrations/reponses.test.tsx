import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Reponses } from "./reponses";

afterEach(() => vi.unstubAllGlobals());

const bouton = () => screen.getByRole("button", { name: /chercher les réponses/i });

describe("Reponses", () => {
  it("appelle POST /api/reponses et résume le bilan", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ lus: 12, enregistrees: [{ candidatureId: "c1", messageId: "m1" }], ignores: 11 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<Reponses />);
    fireEvent.click(bouton());
    expect(await screen.findByRole("status")).toHaveTextContent("12 messages lus, 1 réponse enregistrée");
    expect(fetchMock).toHaveBeenCalledWith("/api/reponses", { method: "POST" });
  });

  it("indique qu'aucune réponse n'a été trouvée", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ lus: 3, enregistrees: [], ignores: 3 })));
    render(<Reponses />);
    fireEvent.click(bouton());
    expect(await screen.findByRole("status")).toHaveTextContent("3 messages lus, aucune nouvelle réponse");
  });

  it("affiche l'erreur du serveur", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Lecture de la boîte impossible", { status: 502 })));
    render(<Reponses />);
    fireEvent.click(bouton());
    expect(await screen.findByRole("alert")).toHaveTextContent("Lecture de la boîte impossible");
  });

  it("désactive le bouton pendant la recherche", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<Reponses />);
    fireEvent.click(bouton());
    await waitFor(() => expect(bouton()).toBeDisabled());
  });
});
