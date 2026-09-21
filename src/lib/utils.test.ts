import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("retourne une chaîne", () => {
    expect(typeof cn("a", "b")).toBe("string");
  });

  it("inclut les classes fournies", () => {
    const result = cn("alpha", "beta");
    expect(result).toContain("alpha");
    expect(result).toContain("beta");
  });

  it("ignore les valeurs falsy", () => {
    const result = cn("alpha", false, null, undefined, "beta");
    expect(result).toContain("alpha");
    expect(result).toContain("beta");
  });
});
