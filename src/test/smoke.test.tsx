import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function Hello({ name }: { name: string }) {
  return <p>Bonjour {name}</p>;
}

describe("smoke test (React + jsdom)", () => {
  it("rend un composant dans jsdom", () => {
    render(<Hello name="Biarritz" />);
    expect(screen.getByText("Bonjour Biarritz")).toBeInTheDocument();
  });
});
