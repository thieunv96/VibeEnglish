import { describe, it, expect } from "vitest";
import { cropDrawParams } from "../../src/lib/avatar-crop";

describe("avatar-crop cropDrawParams", () => {
  it("passes the crop area through to the source rect and emits a square output", () => {
    expect(cropDrawParams({ x: 10, y: 20, width: 100, height: 100 }, 256)).toEqual({
      sx: 10,
      sy: 20,
      sw: 100,
      sh: 100,
      dx: 0,
      dy: 0,
      dw: 256,
      dh: 256,
      canvasW: 256,
      canvasH: 256,
    });
  });

  it("lets outSize control the destination square while area controls the source crop", () => {
    expect(cropDrawParams({ x: 0, y: 0, width: 512, height: 512 }, 128)).toEqual({
      sx: 0,
      sy: 0,
      sw: 512,
      sh: 512,
      dx: 0,
      dy: 0,
      dw: 128,
      dh: 128,
      canvasW: 128,
      canvasH: 128,
    });
  });
});
