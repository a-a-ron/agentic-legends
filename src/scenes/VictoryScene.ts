import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { AudioBus } from "../systems/AudioBus";

/**
 * Victory screen. Shows a centered QR card beneath the artwork's title. Both
 * keyboard (Space / Enter) and tap input restart the game.
 */
export class VictoryScene extends Phaser.Scene {
  constructor() { super("Victory"); }
  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    if (this.textures.exists("victory-background")) {
      const bg = this.add.image(w / 2, h / 2, "victory-background");
      const s = Math.max(w / bg.width, h / bg.height);
      bg.setScale(s);
    }

    // QR card.
    const qrX = w / 2;
    const qrY = 412;
    const qrSize = 180;
    this.add.rectangle(qrX, 430, 460, 292, 0xffffff, 0.97)
      .setStrokeStyle(3, 0xf78166);
    this.add.text(qrX, qrY - qrSize / 2 - 24, "Scan to get points on the leaderboard!", {
      fontFamily: "Georgia, serif", fontSize: "20px", color: "#0d1117",
    }).setOrigin(0.5);
    if (this.textures.exists("qr-code")) {
      const qr = this.add.image(qrX, qrY, "qr-code");
      qr.setDisplaySize(qrSize, qrSize);
    } else {
      this.add.text(qrX, qrY, "(QR unavailable)", {
        fontFamily: "system-ui, sans-serif", fontSize: "16px", color: "#6e7681",
      }).setOrigin(0.5);
    }
    this.add.text(qrX, qrY + qrSize / 2 + 24, "Microsoft Ignite - Codia Quest", {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", color: "#3a0d24",
    }).setOrigin(0.5);

    const leaderboard = this.add.text(qrX, 550, "Can't scan? Open the leaderboard", {
      fontFamily: "system-ui, sans-serif", fontSize: "18px", color: "#0969da",
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    leaderboard.on("pointerup", () => {
      window.location.assign(
        "https://eventgamingplatform-ep-iemwxn-cugxh6dcf2h6bvhh.b02.azurefd.net/Home/EventUnavailable?eventTag=Ignite20262026",
      );
    });

    this.add.text(w / 2, 594, "Discover your GitHub Copilot proficiency level!", {
      fontFamily: "system-ui, sans-serif", fontSize: "20px", color: "#ffffff",
      stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5);
    const proficiency = this.add.text(w / 2, 632, "Sign up for proficiency at learn.github.com", {
      fontFamily: "system-ui, sans-serif", fontSize: "18px", color: "#ffffff",
      backgroundColor: "#0969da", padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    proficiency.on("pointerup", () => {
      window.location.assign("https://learn.github.com");
    });

    // Tappable "Play again" button (also a visual cue for desktop).
    const btn = this.add.rectangle(w / 2, h - 36, 280, 48, 0xf78166)
      .setStrokeStyle(2, 0xffd166).setInteractive({ useHandCursor: true });
    const btnLabel = this.add.text(w / 2, h - 36, "▶ Play again", {
      fontFamily: "system-ui, sans-serif", fontSize: "22px", color: "#0d1117",
    }).setOrigin(0.5);
    this.tweens.add({ targets: [btn, btnLabel], alpha: 0.6, duration: 700, yoyo: true, repeat: -1 });

    const restart = () => {
      AudioBus.uiClick();
      this.scene.start("Title");
    };
    btn.on("pointerdown", restart);
    this.input.keyboard?.once("keydown-SPACE", restart);
    this.input.keyboard?.once("keydown-ENTER", restart);
  }
}
