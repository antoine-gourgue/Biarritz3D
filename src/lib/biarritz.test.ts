import { describe, expect, it } from "vitest";

import { BIARRITZ_CENTER, projectToLocal } from "@/lib/biarritz";

describe("projectToLocal", () => {
  it("place le centre à l'origine", () => {
    const [x, z] = projectToLocal(BIARRITZ_CENTER);
    expect(x).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });

  it("oriente l'est vers +x et le nord vers -z", () => {
    const [x, z] = projectToLocal({
      lat: BIARRITZ_CENTER.lat + 0.01,
      lon: BIARRITZ_CENTER.lon + 0.01,
    });
    expect(x).toBeGreaterThan(0);
    expect(z).toBeLessThan(0);
  });

  it("respecte l'échelle métrique (≈ 111 m par millième de degré de latitude)", () => {
    const [, z] = projectToLocal({
      lat: BIARRITZ_CENTER.lat + 0.001,
      lon: BIARRITZ_CENTER.lon,
    });
    expect(Math.abs(z)).toBeCloseTo(111.3, 0);
  });
});
