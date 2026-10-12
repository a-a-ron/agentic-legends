import Phaser from "phaser";
import { GAME_WIDTH } from "../config";
import { AudioBus } from "./AudioBus";

export class DialogBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private resolveFn: (() => void) | null = null;
  private lines: string[] = [];
  private idx = 0;
  private text!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private portrait!: Phaser.GameObjects.Image | null;
  private listenersBound = false;
  private spaceHandler = () => this.advance();
  private clickHandler = () => this.advance();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(lines: string[], portraitKey?: string): Promise<void> {
    return new Promise((resolve) => {
      this.lines = lines;
      this.idx = 0;
      this.resolveFn = resolve;
      this.build(portraitKey);
      this.render();
      this.bind();
    });
  }

  private build(portraitKey?: string) {
    const w = GAME_WIDTH;
    const y = 580;
    const bg = this.scene.add.rectangle(w / 2, y, w - 80, 200, 0x0d1117, 0.92)
      .setStrokeStyle(3, 0xf78166);
    this.text = this.scene.add.text(80, y - 60, "", {
      fontFamily: "Georgia, serif",
      fontSize: "22px",
      color: "#e6edf3",
      wordWrap: { width: w - 220 },
    });
    this.prompt = this.scene.add.text(w - 100, y + 70, "▶ Space", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#f78166",
    }).setOrigin(1, 0.5);
    this.scene.tweens.add({ targets: this.prompt, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });

    let portrait: Phaser.GameObjects.Image | null = null;
    if (portraitKey && this.scene.textures.exists(portraitKey)) {
      portrait = this.scene.add.image(w - 130, y, portraitKey);
      const targetH = 160;
      portrait.setScale(targetH / portrait.height);
    }
    this.portrait = portrait;

    this.container = this.scene.add.container(0, 0, [bg, this.text, this.prompt]);
    if (portrait) this.container.add(portrait);
    this.container.setDepth(100).setScrollFactor(0);
  }

  private render() {
    this.text.setText(this.lines[this.idx] ?? "");
  }

  private bind() {
    if (this.listenersBound) return;
    this.scene.input.keyboard?.on("keydown-SPACE", this.spaceHandler);
    this.scene.input.keyboard?.on("keydown-ENTER", this.spaceHandler);
    this.scene.input.on("pointerdown", this.clickHandler);
    this.listenersBound = true;
  }

  private unbind() {
    if (!this.listenersBound) return;
    this.scene.input.keyboard?.off("keydown-SPACE", this.spaceHandler);
    this.scene.input.keyboard?.off("keydown-ENTER", this.spaceHandler);
    this.scene.input.off("pointerdown", this.clickHandler);
    this.listenersBound = false;
  }

  private advance() {
    AudioBus.uiClick();
    this.idx += 1;
    if (this.idx >= this.lines.length) {
      this.unbind();
      this.container?.destroy(true);
      this.container = null;
      this.portrait = null;
      const r = this.resolveFn;
      this.resolveFn = null;
      r?.();
      return;
    }
    this.render();
  }
}
