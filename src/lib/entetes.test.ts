import { describe, expect, it } from "vitest";
import { analyserEntetes } from "./entetes";

const brut = (lignes: string[]) => lignes.join("\r\n") + "\r\n\r\ncorps ignoré";

describe("analyserEntetes", () => {
  it("construit un message reçu à partir des en-têtes", () => {
    const m = analyserEntetes(
      brut([
        "Message-ID: <r1@acme.fr>",
        "In-Reply-To: <abc@gmail.com>",
        "References: <x@y.fr> <abc@gmail.com>",
        "From: Camille <camille@acme.fr>",
        "Subject: Re: candidature",
        "Date: Thu, 15 Oct 2026 12:00:00 +0200",
      ]),
    );
    expect(m).toEqual({
      messageId: "<r1@acme.fr>",
      enReponseA: ["<abc@gmail.com>", "<x@y.fr>"],
      de: "Camille <camille@acme.fr>",
      objet: "Re: candidature",
      recuLe: "2026-10-15T10:00:00.000Z",
    });
  });

  it("déplie les en-têtes sur plusieurs lignes et ignore la casse des noms", () => {
    const m = analyserEntetes(
      brut([
        "message-id: <r2@acme.fr>",
        "REFERENCES: <a@b.fr>",
        " <c@d.fr>",
        "from: camille@acme.fr",
        "subject: Re: un objet",
        " très long",
        "date: Thu, 15 Oct 2026 10:00:00 GMT",
      ]),
    );
    expect([...(m?.enReponseA ?? [])].sort()).toEqual(["<a@b.fr>", "<c@d.fr>"]);
    expect(m?.objet).toBe("Re: un objet très long");
  });

  it("décode les mots encodés RFC 2047 (UTF-8, Q et B)", () => {
    const m = analyserEntetes(
      brut([
        "Message-ID: <r3@acme.fr>",
        "From: =?UTF-8?Q?Ren=C3=A9?= <rene@acme.fr>",
        "Subject: =?UTF-8?B?UsOpcG9uc2U=?=",
        "Date: Thu, 15 Oct 2026 10:00:00 +0000",
      ]),
    );
    expect(m?.de).toBe("René <rene@acme.fr>");
    expect(m?.objet).toBe("Réponse");
  });

  it("sans fil de réponse, enReponseA est vide", () => {
    const m = analyserEntetes(brut(["Message-ID: <r4@acme.fr>", "From: a@b.fr", "Subject: Bonjour", "Date: Thu, 15 Oct 2026 10:00:00 +0000"]));
    expect(m?.enReponseA).toEqual([]);
  });

  it("retourne null sans identifiant de message ou avec une date illisible", () => {
    expect(analyserEntetes(brut(["From: a@b.fr", "Subject: x", "Date: Thu, 15 Oct 2026 10:00:00 +0000"]))).toBeNull();
    expect(analyserEntetes(brut(["Message-ID: <r5@acme.fr>", "From: a@b.fr", "Subject: x", "Date: pas une date"]))).toBeNull();
  });

  it("ne lit pas le corps comme des en-têtes", () => {
    const m = analyserEntetes(
      "Message-ID: <r6@acme.fr>\r\nFrom: a@b.fr\r\nDate: Thu, 15 Oct 2026 10:00:00 +0000\r\n\r\nSubject: piégé\r\nIn-Reply-To: <faux@x.fr>",
    );
    expect(m?.objet).toBe("");
    expect(m?.enReponseA).toEqual([]);
  });
});
