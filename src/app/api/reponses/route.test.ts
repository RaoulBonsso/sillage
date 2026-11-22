// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { avancer, nouvelleCandidature } from "@/domaine/pipeline";
import type { MessageRecu } from "@/domaine/reponses";
import { emettre, espaceDe } from "@/lib/jeton";
import { depot } from "@/lib/serveur";

const jeton = vi.hoisted(() => ({ valeur: undefined as string | undefined }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => (jeton.valeur ? { value: jeton.valeur } : undefined) }) }));

const imap = vi.hoisted(() => ({ lireBoiteGmail: vi.fn() }));
vi.mock("@/lib/imap", () => imap);

const SECRET = "t".repeat(40);
const email = "reponses@exemple.invalid";
const esp = espaceDe(email);

beforeAll(() => {
  process.env.SILLAGE_SECRET = SECRET;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_B64;
});
beforeEach(() => {
  jeton.valeur = emettre({ u: "session", email, esp, exp: 0 }, SECRET);
  imap.lireBoiteGmail.mockReset();
});

const appeler = async () => (await import("./route")).POST();

describe("POST /api/reponses", () => {
  it("refuse sans session (401) et ne lit pas la boîte", async () => {
    jeton.valeur = undefined;
    expect((await appeler()).status).toBe(401);
    expect(imap.lireBoiteGmail).not.toHaveBeenCalled();
  });

  it("applique la règle aux messages lus et renvoie le bilan", async () => {
    const d = depot(esp);
    await d.candidatures.ecrire(
      avancer(
        nouvelleCandidature("acme", { cv: "cv.pdf", lettre: "", email: { objet: "o", corps: "c" }, miniProjet: "" }, "2026-10-13T08:00:00.000Z"),
        "envoyee",
        "2026-10-13T09:00:00.000Z",
        "envoyée",
        "humain",
        "<acme@gmail.com>",
      ),
    );
    const m: MessageRecu = { messageId: "<r1@acme.fr>", enReponseA: ["<acme@gmail.com>"], de: "x@acme.fr", objet: "Re", recuLe: "2026-10-15T10:00:00.000Z" };
    imap.lireBoiteGmail.mockResolvedValue([m]);
    const r = await appeler();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ lus: 1, enregistrees: [{ candidatureId: "acme", messageId: "<r1@acme.fr>" }], ignores: 0 });
    expect((await d.candidatures.lire("acme"))?.etape).toBe("reponse");
    expect(imap.lireBoiteGmail.mock.calls[0][0]).toBeInstanceOf(Date);
  });

  it("répond 502 avec le motif si la lecture de la boîte échoue", async () => {
    imap.lireBoiteGmail.mockRejectedValue(new Error("Lecture non configurée : GMAIL_USER / GMAIL_APP_PASSWORD manquants"));
    const r = await appeler();
    expect(r.status).toBe(502);
    expect(await r.text()).toContain("Lecture non configurée");
  });
});
