import { describe, it, expect, vi } from "vitest";
import Phaser from "phaser";
import { CorruptionEnemy } from "../src/entities/CorruptionEnemy";

vi.mock("phaser", () => {
  class Sprite {
    x: number;
    body = { velocity: { x: 0 } };
    flipX = false;
    constructor(_scene: unknown, x: number) { this.x = x; }
    setDisplaySize() { return this; }
    setCollideWorldBounds() { return this; }
    setBounce() { return this; }
    setDepth() { return this; }
    setVelocityX(value: number) { this.body.velocity.x = value; return this; }
    setFlipX(value: boolean) { this.flipX = value; return this; }
  }
  return { default: { Physics: { Arcade: { Sprite } } } };
});

function enemy(speed = 24) {
  const scene = {
    add: { existing: vi.fn() },
    physics: { add: { existing: vi.fn() } },
    textures: { exists: () => true },
  };
  return new CorruptionEnemy(scene as unknown as Phaser.Scene, 900, 620, 120, "rat", speed);
}

describe("enemy patrol", () => {
  it("restores movement after physics-group insertion resets velocity", () => {
    const rat = enemy();
    rat.setVelocityX(0);
    rat.update();
    expect(rat.body?.velocity.x).toBe(24);
    expect(rat.flipX).toBe(false);
  });

  it("turns at both patrol boundaries and keeps moving between them", () => {
    const rat = enemy();
    rat.x = 1021;
    rat.update();
    expect(rat.body?.velocity.x).toBe(-24);
    expect(rat.flipX).toBe(true);
    rat.x = 900;
    rat.setVelocityX(0);
    rat.update();
    expect(rat.body?.velocity.x).toBe(-24);
    rat.x = 779;
    rat.update();
    expect(rat.body?.velocity.x).toBe(24);
    expect(rat.flipX).toBe(false);
  });

  it("preserves the default bug patrol speed", () => {
    const scene = {
      add: { existing: vi.fn() },
      physics: { add: { existing: vi.fn() } },
      textures: { exists: () => true },
    };
    const bug = new CorruptionEnemy(scene as unknown as Phaser.Scene, 900, 620, 120);
    bug.setVelocityX(0);
    bug.update();
    expect(bug.body?.velocity.x).toBe(55);
  });
});
