import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const ASSETS = import.meta.glob("../assets/generated/*.{webp,png}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function urlFor(slug: string): string | undefined {
  const match = Object.entries(ASSETS).find(
    ([k]) => k.endsWith(`/${slug}.webp`) || k.endsWith(`/${slug}.png`),
  );
  return match?.[1];
}

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const barBg = this.add.rectangle(w / 2, h / 2, 480, 24, 0x222a36).setStrokeStyle(2, 0x3a4759);
    const bar = this.add.rectangle(w / 2 - 240, h / 2, 0, 20, 0xf78166).setOrigin(0, 0.5);
    this.add.text(w / 2, h / 2 - 48, "Loading Codia...", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "28px",
      color: "#e6edf3",
    }).setOrigin(0.5);

    this.load.on("progress", (p: number) => {
      bar.width = 480 * p;
      bar.x = w / 2 - 240;
    });

    const keys: Array<[string, string]> = [
      ["title-art", "title-art"],
      ["forest-archive-bg", "forest-archive-bg"],
      ["enchanted-forest", "enchanted-forest"],
      ["forest-archive-rat", "forest-archive-rat"],
      ["start-mol", "start-mol"],
      ["mona-portrait", "mona-intro"],
      ["ducky-intro", "ducky-intro"],
      ["ducky-portrait", "ducky"],
      ["copilot-intro", "copilot-intro"],
      ["copilot-portrait", "copilot2"],
      ["adventurer-bubbles", "adventurer-bubbles-portrait"],
      ["adventurer-fork", "adventurer-fork-portrait"],
      ["adventurer-goggles", "adventurer-goggles-portrait"],
      ["bubbles-reward", "bubbles-reward"],
      ["fork-reward", "fork-reward"],
      ["goggles-reward", "goggles-reward"],
      ["next-challenge-hero", "next-challenge-hero"],
      ["next-challenge-item", "next-challenge-item"],
      ["copilot-orb", "copilot-orb"],
      ["qr-code", "qr-code"],
    ];
    for (const [key, slug] of keys) {
      const url = urlFor(slug);
      if (url) this.load.image(key, url);
    }
    const walkUrl = urlFor("adventurer-walk");
    if (walkUrl) {
      this.load.spritesheet("adventurer-walk", walkUrl, {
        frameWidth: 76,
        frameHeight: 116,
      });
    }

    const idleUrl = urlFor("adventurer-idle");
    if (idleUrl) {
      this.load.spritesheet("adventurer-idle", idleUrl, {
        frameWidth: 128,
        frameHeight: 124,
      });
    }

    const jumpUrl = urlFor("adventurer-jump");
    if (jumpUrl) {
      this.load.spritesheet("adventurer-jump", jumpUrl, {
        frameWidth: 72,
        frameHeight: 74,
      });
    }
  }

  create() {
    document.getElementById("boot-msg")?.remove();
    if (this.textures.exists("ducky-portrait")) {
      this.textures.get("ducky-portrait").setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    if (this.textures.exists("copilot-portrait")) {
      this.textures.get("copilot-portrait").setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    if (this.textures.exists("forest-archive-rat")) {
      this.textures.get("forest-archive-rat").setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    if (this.textures.exists("adventurer-walk")) {
      // Pixel-art: avoid bilinear blur on upscale.
      this.textures.get("adventurer-walk").setFilter(Phaser.Textures.FilterMode.NEAREST);
      if (!this.anims.exists("adventurer-walk")) {
        this.anims.create({
          key: "adventurer-walk",
          frames: this.anims.generateFrameNumbers("adventurer-walk", { start: 0, end: 7 }),
          frameRate: 12,
          repeat: -1,
        });
      }
    }
    if (this.textures.exists("adventurer-idle")) {
      this.textures.get("adventurer-idle").setFilter(Phaser.Textures.FilterMode.NEAREST);
      if (!this.anims.exists("adventurer-idle")) {
        this.anims.create({
          key: "adventurer-idle",
          frames: this.anims.generateFrameNumbers("adventurer-idle", { start: 0, end: 7 }),
          frameRate: 6,
          repeat: -1,
        });
      }
    }
    if (this.textures.exists("adventurer-jump")) {
      this.textures.get("adventurer-jump").setFilter(Phaser.Textures.FilterMode.NEAREST);
      // Sheet packs two anims: frames 0-3 = upward jump, frames 4-7 = falling.
      if (!this.anims.exists("adventurer-jump")) {
        this.anims.create({
          key: "adventurer-jump",
          frames: this.anims.generateFrameNumbers("adventurer-jump", { start: 0, end: 3 }),
          frameRate: 10,
          repeat: 0,
        });
      }
      if (!this.anims.exists("adventurer-fall")) {
        this.anims.create({
          key: "adventurer-fall",
          frames: this.anims.generateFrameNumbers("adventurer-jump", { start: 4, end: 7 }),
          frameRate: 8,
          repeat: -1,
        });
      }
    }
    this.generateRewardIcons();
    this.generateParticleTextures();
    this.scene.start("Title");
  }

  private generateParticleTextures() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Dust particle: soft circular puff for jumps/landings
    g.clear();
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(4, 4, 3.5);
    g.generateTexture("particle-dust", 8, 8);

    // Sparkle particle: 4-pointed star
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(6, 0, 8, 6, 4, 6);
    g.fillTriangle(6, 12, 8, 6, 4, 6);
    g.fillTriangle(0, 6, 6, 4, 6, 8);
    g.fillTriangle(12, 6, 6, 4, 6, 8);
    g.fillStyle(0xffe066, 0.9);
    g.fillCircle(6, 6, 2.5);
    g.generateTexture("particle-sparkle", 12, 12);

    // Mote particle: tiny glowing ambient dot
    g.clear();
    g.fillStyle(0x6cd0ff, 0.4);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(4, 4, 2);
    g.generateTexture("particle-mote", 8, 8);

    g.destroy();
  }

  private generateRewardIcons() {
    const size = 96;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Fork of Curiosity — orange diamond gem with highlight
    g.clear();
    g.fillStyle(0xff8a3d, 1);
    g.fillTriangle(size / 2, 6, size - 10, size / 2, size / 2, size - 6);
    g.fillTriangle(size / 2, 6, 10, size / 2, size / 2, size - 6);
    g.lineStyle(3, 0xffd166, 1);
    g.strokeTriangle(size / 2, 6, size - 10, size / 2, size / 2, size - 6);
    g.strokeTriangle(size / 2, 6, 10, size / 2, size / 2, size - 6);
    g.fillStyle(0xfff3b0, 0.85);
    g.fillTriangle(size / 2, 16, size / 2 + 14, size / 2, size / 2, size / 2 + 6);
    g.generateTexture("fork-icon", size, size);

    // Bubbles of Clarity — three glowing blue spheres
    g.clear();
    g.fillStyle(0x6cd0ff, 0.35);
    g.fillCircle(size / 2, size / 2 + 4, size / 2 - 2);
    g.fillStyle(0x3aa0ff, 1);
    g.fillCircle(size / 2, size / 2 + 8, 26);
    g.fillStyle(0x9be7ff, 1);
    g.fillCircle(size / 2 - 10, size / 2 - 2, 8);
    g.fillStyle(0x6cd0ff, 1);
    g.fillCircle(size / 2 + 18, size / 2 - 14, 6);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(size / 2 - 5, size / 2 + 2, 5);
    g.lineStyle(2, 0xe6f7ff, 0.9);
    g.strokeCircle(size / 2, size / 2 + 8, 26);
    g.generateTexture("bubbles-icon", size, size);

    // Goggles of Insight — two purple-rimmed blue lenses on a strap
    g.clear();
    g.fillStyle(0x2a3457, 1);
    g.fillRect(8, size / 2 - 6, size - 16, 12);
    g.fillStyle(0x6c63ff, 1);
    g.fillCircle(size / 2 - 18, size / 2, 18);
    g.fillCircle(size / 2 + 18, size / 2, 18);
    g.fillStyle(0x6cd0ff, 1);
    g.fillCircle(size / 2 - 18, size / 2, 12);
    g.fillCircle(size / 2 + 18, size / 2, 12);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(size / 2 - 22, size / 2 - 4, 4);
    g.fillCircle(size / 2 + 14, size / 2 - 4, 4);
    g.lineStyle(2, 0xe6edf3, 0.9);
    g.strokeCircle(size / 2 - 18, size / 2, 18);
    g.strokeCircle(size / 2 + 18, size / 2, 18);
    g.generateTexture("goggles-icon", size, size);

    g.destroy();
  }
}
