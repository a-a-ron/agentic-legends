import Phaser from "phaser";
import { fitWithin } from "../util/fit";
import { AudioBus } from "./AudioBus";

/**
 * Full-screen modal that displays a reward poster (full, uncropped).
 * Resolves once the player presses space / clicks.
 */
export function showRewardModal(scene: Phaser.Scene, textureKey: string, caption?: string): Promise<void> {
  return new Promise((resolve) => {
    const w = scene.scale.width;
    const h = scene.scale.height;

    const dim = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.9)
      .setScrollFactor(0).setDepth(300);

    const showCaption = !!caption && caption.length > 0;
    const captionY = h - 56;
    const promptY = h - 24;
    const reservedBottom = showCaption ? h - (captionY - 30) : h - (promptY - 18);
    const padX = 32;
    const padTop = 32;
    const maxW = w - padX * 2;
    const maxH = h - padTop - reservedBottom;

    let img: Phaser.GameObjects.Image | null = null;
    if (scene.textures.exists(textureKey)) {
      img = scene.add.image(0, 0, textureKey).setScrollFactor(0).setDepth(301);
      const { scale, height: drawnH } = fitWithin(img.width, img.height, maxW, maxH);
      img.setScale(scale);
      img.setPosition(w / 2, padTop + drawnH / 2);
    }

    let captionText: Phaser.GameObjects.Text | null = null;
    if (showCaption) {
      captionText = scene.add.text(w / 2, captionY, caption!, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#f78166",
        align: "center",
        wordWrap: { width: w - 120 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    }

    const prompt = scene.add.text(w / 2, promptY, "▶ Press Space to continue", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: "#c9d1d9",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    scene.tweens.add({ targets: prompt, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });

    const advance = () => {
      AudioBus.uiClick();
      cleanup();
      resolve();
    };
    const cleanup = () => {
      scene.input.keyboard?.off("keydown-SPACE", advance);
      scene.input.keyboard?.off("keydown-ENTER", advance);
      scene.input.off("pointerdown", advance);
      [dim, prompt].forEach((o) => o.destroy());
      captionText?.destroy();
      img?.destroy();
    };
    scene.input.keyboard?.on("keydown-SPACE", advance);
    scene.input.keyboard?.on("keydown-ENTER", advance);
    scene.input.on("pointerdown", advance);
  });
}
