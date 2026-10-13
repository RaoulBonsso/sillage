import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

describe("Markdown", () => {
  it("rend titres, listes, gras et liens http", () => {
    render(<Markdown texte={"# Bilan\n- **8** cibles\n- voir [site](https://a.fr)"} />);
    expect(screen.getByText("Bilan")).toBeInTheDocument();
    expect(screen.getByText("8").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "site" })).toHaveAttribute("href", "https://a.fr");
  });
  it("n'interprète ni HTML ni liens javascript:", () => {
    const { container } = render(<Markdown texte={"<img src=x onerror=alert(1)> [x](javascript:alert(1))"} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
  });
});
