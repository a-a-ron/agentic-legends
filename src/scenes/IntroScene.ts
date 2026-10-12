import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { INTRO_NARRATION } from "../data/story";
import { AudioBus } from "../systems/AudioBus";

export class IntroScene extends Phaser.Scene {
  private idx = 0;
  private narrationText!: Phaser.GameObjects.Text;
  private continueText!: Phaser.GameObjects.Text;

  constructor() {
    super("Intro");
  }

  create() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    this.idx = 0;

    const bgKey = this.textures.exists("title-art") ? "title-art" : "start-mol";
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(w / 2, h / 2, bgKey);
      const scale = Math.max(w / bg.width, h / bg.height);
      bg.setScale(scale).setAlpha(0.35);
    }
    this.add.rectangle(w / 2, h / 2, w, h, 0x0d1117, 0.55);

    this.narrationText = this.add.text(w / 2, h / 2, "", {
      fontFamily: "Georgia, serif",
      fontSize: "26px",
      color: "#e6edf3",
      align: "center",
      wordWrap: { width: w - 240 },
    }).setOrigin(0.5);

    this.continueText = this.add.text(w / 2, h - 80, "▶ Space / click to continue", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      color: "#f78166",
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.continueText, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });

    this.showNext();
    const advance = () => this.advance();
    this.input.keyboard?.on("keydown-SPACE", advance);
    this.input.keyboard?.on("keydown-ENTER", advance);
    this.input.on("pointerdown", advance);
  }

  private showNext() {
    this.narrationText.setText(INTRO_NARRATION[this.idx]);
    this.narrationText.setAlpha(0);
    this.tweens.add({ targets: this.narrationText, alpha: 1, duration: 400 });
  }

  private advance() {
    this.idx++;
    AudioBus.uiClick();
    if (this.idx >= INTRO_NARRATION.length) {
      this.scene.start("LevelMona");
      return;
    }
    this.showNext();
  }
}
