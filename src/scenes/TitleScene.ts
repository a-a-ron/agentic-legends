import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { AudioBus } from "../systems/AudioBus";
import { addFullscreenButton } from "../systems/FullscreenButton";
import { isTouchDevice } from "../systems/TouchControls";

export class TitleScene extends Phaser.Scene {
  private started = false;

  constructor() {
    super("Title");
  }

  create() {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    this.started = false;

    // Render the pixel-art title artwork
    if (this.textures.exists("title-art")) {
      const bg = this.add.image(w / 2, h / 2, "title-art");
      const scale = Math.max(w / bg.width, h / bg.height);
      bg.setScale(scale);
    } else if (this.textures.exists("start-mol")) {
      const bg = this.add.image(w / 2, h / 2, "start-mol");
      const scale = Math.max(w / bg.width, h / bg.height);
      bg.setScale(scale).setAlpha(0.65);
      this.add.rectangle(w / 2, h / 2, w, h, 0x0d1117, 0.45);
      this.add.text(w / 2, 140, "AGENTIC LEGENDS", {
        fontFamily: "Georgia, serif",
        fontSize: "76px",
        color: "#f78166",
        stroke: "#000",
        strokeThickness: 6,
      }).setOrigin(0.5);
      this.add.text(w / 2, 210, "Restore the Sacred Mainline", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        color: "#e6edf3",
      }).setOrigin(0.5);
    }

    // Ambient floating magic motes & twinkling sparkles across the night sky
    if (this.textures.exists("particle-sparkle")) {
      this.add.particles(w / 2, 110, "particle-sparkle", {
        x: { min: -w / 2 + 60, max: w / 2 - 60 },
        y: { min: -90, max: 80 },
        scale: { start: 0, end: 1, ease: "Sine.easeInOut" },
        alpha: { start: 0, end: 0.8, ease: "Sine.easeInOut" },
        lifespan: { min: 1400, max: 2400 },
        frequency: 350,
        blendMode: Phaser.BlendModes.ADD,
        emitting: true,
      });
    }
    if (this.textures.exists("particle-mote")) {
      this.add.particles(w / 2, h - 80, "particle-mote", {
        x: { min: -w / 2 + 100, max: w / 2 - 100 },
        y: { min: -40, max: 30 },
        speedY: { min: -25, max: -8 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: { min: 2000, max: 3200 },
        frequency: 450,
        blendMode: Phaser.BlendModes.ADD,
        emitting: true,
      });
    }

    // Version label in bottom right corner
    this.add.text(w - 16, h - 16, `v${__APP_VERSION__}`, {
      fontFamily: "ui-monospace, Menlo, monospace",
      fontSize: "13px",
      color: "#8b949e",
    }).setOrigin(1, 1).setDepth(20);

    // Bottom bar for controls and version
    this.add.rectangle(w / 2, h - 18, w, 36, 0x090d16, 0.85).setDepth(19);

    // Call-to-action Start button — positioned gracefully under the title banner
    const btnW = 340;
    const btnH = 40;
    const btnY = 246;

    const btnBg = this.add.rectangle(w / 2, btnY, btnW, btnH, 0x0d1117, 0.9)
      .setStrokeStyle(2, 0xf78166)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    const btnText = this.add.text(w / 2, btnY, "▶ PRESS SPACE OR TAP TO BEGIN", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#f78166",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(21);

    // Breathing pulse tween for start button
    this.tweens.add({
      targets: [btnBg, btnText],
      scale: 1.03,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    btnBg.on("pointerover", () => {
      btnBg.setFillStyle(0x21262d, 0.98);
      btnText.setColor("#ffffff");
      AudioBus.uiHover();
    });
    btnBg.on("pointerout", () => {
      btnBg.setFillStyle(0x0d1117, 0.92);
      btnText.setColor("#f78166");
    });

    // Controls reminder at bottom bar
    this.add.text(w / 2, h - 18, "Move  ←/→ · A/D   |   Run  Shift   |   Jump  Space · W   |   Pause  Esc   |   Mute  M", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      color: "#c9d1d9",
    }).setOrigin(0.5).setDepth(20);

    // Fullscreen and Mute buttons at top-right
    addFullscreenButton(this, w - 40, 36);
    if (isTouchDevice()) {
      this.add.text(w - 70, 36, "Fullscreen", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        color: "#6cd0ff",
      }).setOrigin(1, 0.5).setDepth(20);
    }

    // Mute toggle button
    const muteBtnX = isTouchDevice() ? w - 160 : w - 88;
    const muteBg = this.add.circle(muteBtnX, 36, 18, 0x0d1117, 0.8)
      .setStrokeStyle(1, 0xf78166)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    const muteIcon = this.add.text(muteBtnX, 36, AudioBus.isMuted() ? "🔇" : "🔊", {
      fontSize: "16px",
    }).setOrigin(0.5).setDepth(21);

    muteBg.on("pointerdown", () => {
      const isMuted = AudioBus.toggleMute();
      muteIcon.setText(isMuted ? "🔇" : "🔊");
      if (!isMuted) AudioBus.uiClick();
    });
    muteBg.on("pointerover", () => muteBg.setFillStyle(0x21262d, 0.9));
    muteBg.on("pointerout", () => muteBg.setFillStyle(0x0d1117, 0.8));

    this.input.keyboard?.on("keydown-M", () => {
      const isMuted = AudioBus.toggleMute();
      muteIcon.setText(isMuted ? "🔇" : "🔊");
    });

    // Start action
    const start = () => {
      if (this.started) return;
      this.started = true;
      AudioBus.uiClick();
      this.cameras.main.fadeOut(250, 13, 17, 23);
      this.time.delayedCall(250, () => {
        this.scene.start("Intro");
      });
    };

    btnBg.on("pointerdown", start);
    btnText.setInteractive({ useHandCursor: true }).on("pointerdown", start);
    this.input.keyboard?.once("keydown-SPACE", start);
    this.input.keyboard?.once("keydown-ENTER", start);

    // Title screen ambient theme
    AudioBus.startBackground([220, 261, 330, 392, 330, 261, 196, 247, 294, 392, 294, 247], 320);
  }
}

