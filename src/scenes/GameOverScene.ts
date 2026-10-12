import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { AudioBus } from "../systems/AudioBus";

export class GameOverScene extends Phaser.Scene {
  private from: string = "LevelMona";
  constructor() { super("GameOver"); }
  init(data: { from?: string }) { this.from = data.from ?? "LevelMona"; }
  create() {
    AudioBus.stopBackground();
    AudioBus.gameOver();

    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0d1117, 1);
    this.add.text(w / 2, 180, "Codia falters...", {
      fontFamily: "Georgia, serif", fontSize: "56px", color: "#ff6b81",
    }).setOrigin(0.5);
    this.add.text(w / 2, 270, "The corruption spreads, but the Adventurer can rise again.", {
      fontFamily: "Georgia, serif", fontSize: "22px", color: "#e6edf3",
      align: "center", wordWrap: { width: w - 240 },
    }).setOrigin(0.5);

    const makeButton = (y: number, label: string, color: number, onTap: () => void) => {
      const bg = this.add.rectangle(w / 2, y, 360, 64, color)
        .setStrokeStyle(2, 0xffd166)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(w / 2, y, label, {
        fontFamily: "system-ui, sans-serif", fontSize: "24px", color: "#0d1117",
      }).setOrigin(0.5);
      bg.on("pointerover", () => {
        bg.setFillStyle(color, 0.85);
        AudioBus.uiHover();
      });
      bg.on("pointerout", () => bg.setFillStyle(color));
      bg.on("pointerdown", () => {
        AudioBus.uiClick();
        onTap();
      });
      return { bg, txt };
    };

    const retry = () => {
      AudioBus.uiClick();
      this.scene.start(this.from);
    };
    const goTitle = () => {
      AudioBus.uiClick();
      this.scene.start("Title");
    };

    makeButton(420, "↺  Retry stage  (R)", 0xf78166, retry);
    makeButton(500, "⌂  Back to title  (T)", 0xc9d1d9, goTitle);

    this.input.keyboard?.once("keydown-R", retry);
    this.input.keyboard?.once("keydown-T", goTitle);
    this.input.keyboard?.once("keydown-SPACE", retry);
  }
}
