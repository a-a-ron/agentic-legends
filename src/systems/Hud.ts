import Phaser from "phaser";
import type { Power } from "../entities/Adventurer";
import { AudioBus } from "./AudioBus";
import { isTouchDevice } from "./TouchControls";
import { addFullscreenButton } from "./FullscreenButton";

const POWER_COLORS: Record<Power, number> = {
  fork: 0x9c8cff,
  bubbles: 0xffd166,
  goggles: 0x6cd0ff,
};
const POWER_LABEL: Record<Power, string> = {
  fork: "F",
  bubbles: "B",
  goggles: "G",
};

export class Hud {
  private scene: Phaser.Scene;
  private hearts: Phaser.GameObjects.Text[] = [];
  private giftIcons: Map<Power, Phaser.GameObjects.Container> = new Map();
  private titleText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, levelTitle: string, options: { showLeapTip?: boolean } = {}) {
    this.scene = scene;

    for (let i = 0; i < 3; i++) {
      const t = scene.add.text(24 + i * 36, 20, "♥", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "32px",
        color: "#ff6b81",
      }).setScrollFactor(0).setDepth(50);
      this.hearts.push(t);
    }

    (["fork", "bubbles", "goggles"] as Power[]).forEach((p, i) => {
      const x = 24 + i * 44;
      const y = 70;
      const circle = scene.add.circle(0, 0, 14, POWER_COLORS[p], 0.25).setStrokeStyle(2, POWER_COLORS[p]);
      const label = scene.add.text(0, 0, POWER_LABEL[p], {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#ffffff",
      }).setOrigin(0.5);
      const c = scene.add.container(x, y, [circle, label]).setScrollFactor(0).setDepth(50).setAlpha(0.25);
      this.giftIcons.set(p, c);
    });

    this.titleText = scene.add.text(scene.scale.width / 2, 30, levelTitle, {
      fontFamily: "Georgia, serif",
      fontSize: "22px",
      color: "#e6edf3",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);

    const touch = isTouchDevice();
    const controlsLines = touch
      ? [
          "Move  ◀  ▶",
          "Jump  ⤒",
          "Restart  ↺",
          "Fullscreen  ⛶",
          "Trivia  tap an answer",
        ]
      : [
          "Move  ←/→ · A/D",
          "Run   Shift",
          "Jump  Space · W",
          "Pause Esc · Mute M",
          "Restart R · Quit Q",
        ];
    if (options.showLeapTip && !touch) {
      controlsLines.push("Tip: double-tap Space to leap higher");
    } else if (options.showLeapTip && touch) {
      controlsLines.push("Tip: double-tap ⤒ to leap higher");
    }
    const headerSize = touch ? 18 : 12;
    const bodySize = touch ? 20 : 13;
    const lineHeight = touch ? 28 : 18;
    const padX = touch ? 14 : 10;
    const padTop = touch ? 10 : 6;
    const panelW = touch ? 320 : 220;
    const panelH = controlsLines.length * lineHeight + (touch ? 44 : 28);
    const panelX = scene.scale.width - panelW - 16;
    const panelY = 16;
    const panel = scene.add.rectangle(panelX, panelY, panelW, panelH, 0x0d1117, 0.65)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xf78166, 0.7)
      .setScrollFactor(0)
      .setDepth(50);
    const header = scene.add.text(panelX + padX, panelY + padTop, "CONTROLS", {
      fontFamily: "system-ui, sans-serif",
      fontSize: `${headerSize}px`,
      color: "#f78166",
      fontStyle: "bold",
    }).setScrollFactor(0).setDepth(51);
    const body = scene.add.text(panelX + padX, panelY + padTop + headerSize + 6, controlsLines.join("\n"), {
      fontFamily: "ui-monospace, Menlo, Consolas, monospace",
      fontSize: `${bodySize}px`,
      color: "#c9d1d9",
      lineSpacing: touch ? 8 : 4,
    }).setScrollFactor(0).setDepth(51);
    void panel; void header; void body;

    // Tappable restart button — anchored just below the controls panel.
    const restartX = scene.scale.width - 32;
    const restartY = panelY + panelH + 28;
    const restartBg = scene.add.circle(restartX, restartY, 22, 0x0d1117, 0.75)
      .setStrokeStyle(2, 0xf78166).setScrollFactor(0).setDepth(60)
      .setInteractive({ useHandCursor: true });
    const restartGlyph = scene.add.text(restartX, restartY, "↺", {
      fontFamily: "system-ui, sans-serif", fontSize: "26px", color: "#f78166",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    restartBg.on("pointerover", () => restartBg.setFillStyle(0x21262d, 0.85));
    restartBg.on("pointerout", () => restartBg.setFillStyle(0x0d1117, 0.75));
    restartBg.on("pointerdown", () => {
      AudioBus.uiClick();
      const data = scene.scene.settings.data;
      scene.scene.restart(data);
    });
    void restartGlyph;

    // Fullscreen toggle — only rendered on touch devices, placed just left
    // of the restart button so both controls stay grouped in the corner.
    addFullscreenButton(scene, restartX - 52, restartY);

    // Mute toggle button — placed left of fullscreen/restart
    const muteX = touch ? restartX - 104 : restartX - 52;
    const muteBg = scene.add.circle(muteX, restartY, 22, 0x0d1117, 0.75)
      .setStrokeStyle(2, 0xf78166).setScrollFactor(0).setDepth(60)
      .setInteractive({ useHandCursor: true });
    const muteIcon = scene.add.text(muteX, restartY, AudioBus.isMuted() ? "🔇" : "🔊", {
      fontSize: "18px",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    muteBg.on("pointerover", () => muteBg.setFillStyle(0x21262d, 0.85));
    muteBg.on("pointerout", () => muteBg.setFillStyle(0x0d1117, 0.75));
    muteBg.on("pointerdown", () => {
      const isMuted = AudioBus.toggleMute();
      muteIcon.setText(isMuted ? "🔇" : "🔊");
      if (!isMuted) AudioBus.uiClick();
    });
  }

  setHearts(n: number) {
    this.hearts.forEach((h, i) => h.setAlpha(i < n ? 1 : 0.2));
  }

  setPowers(powers: Set<Power>) {
    this.giftIcons.forEach((c, p) => c.setAlpha(powers.has(p) ? 1 : 0.25));
  }

  flashTitle(text: string) {
    this.titleText.setText(text);
  }

  flashWarning(text: string) {
    const w = this.scene.scale.width;
    const banner = this.scene.add.text(w / 2, 96, text, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      color: "#ffd166",
      backgroundColor: "#3a0d24",
      padding: { left: 14, right: 14, top: 8, bottom: 8 },
      align: "center",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(60).setAlpha(0);
    this.scene.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      duration: 250,
      yoyo: true,
      hold: 2400,
      onComplete: () => banner.destroy(),
    });
  }
}
