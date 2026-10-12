import Phaser from "phaser";
import type { QuizQuestion } from "../data/quizzes";
import { shuffleQuestion } from "../util/shuffle";
import { isTouchDevice } from "./TouchControls";

/**
 * Modal multiple-choice quiz. Shown at the end of each level once the player
 * has picked up the reward. Resolves with `true` when the player answers
 * correctly and clicks Continue. Player must keep selecting until correct, so
 * progression is gated on understanding rather than luck.
 */
export class Quiz {
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(question: QuizQuestion): Promise<{ wrongCount: number }> {
    const q = shuffleQuestion(question);
    const touch = isTouchDevice();
    // Sizing — larger fonts and taller option rows on touch devices so
    // the trivia card is comfortably readable / tappable on phones.
    const headerSize = touch ? 30 : 24;
    const promptSize = touch ? 26 : 20;
    const optionSize = touch ? 22 : 17;
    const feedbackSize = touch ? 20 : 16;
    const continueSize = touch ? 22 : 18;
    const rowH = touch ? 50 : 32;
    const rowStep = touch ? 56 : 38;
    return new Promise((resolve) => {
      let wrongCount = 0;
      const w = this.scene.scale.width;
      const h = this.scene.scale.height;
      const cardW = touch ? Math.min(w - 40, 1100) : Math.min(w - 80, 880);
      const cardH = touch ? 560 : 460;

      const dim = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
        .setScrollFactor(0).setDepth(300);
      const card = this.scene.add.rectangle(w / 2, h / 2, cardW, cardH, 0x161b22, 0.98)
        .setStrokeStyle(3, 0xf78166).setScrollFactor(0).setDepth(301);

      const header = this.scene.add.text(w / 2, h / 2 - (touch ? 240 : 200), "Knowledge Check", {
        fontFamily: "Georgia, serif",
        fontSize: `${headerSize}px`,
        color: "#f78166",
      }).setOrigin(0.5).setScrollFactor(0).setDepth(302);

      const prompt = this.scene.add.text(w / 2, h / 2 - (touch ? 180 : 130), q.prompt, {
        fontFamily: "system-ui, sans-serif",
        fontSize: `${promptSize}px`,
        color: "#e6edf3",
        align: "center",
        wordWrap: { width: Math.min(w - 140, touch ? 1000 : 800) },
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(302);

      const feedback = this.scene.add.text(w / 2, h / 2 + (touch ? 170 : 130), "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: `${feedbackSize}px`,
        color: "#8b949e",
        align: "center",
        wordWrap: { width: Math.min(w - 140, touch ? 1000 : 800) },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(302);

      const continueLabel = this.scene.add.text(w / 2, h / 2 + (touch ? 240 : 195), "▶ Tap or press Space to continue", {
        fontFamily: "system-ui, sans-serif",
        fontSize: `${continueSize}px`,
        color: "#3fb950",
        backgroundColor: "#0d1117",
        padding: { left: touch ? 16 : 12, right: touch ? 16 : 12, top: touch ? 10 : 6, bottom: touch ? 10 : 6 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(302).setVisible(false).setInteractive({ useHandCursor: true });
      continueLabel.on("pointerdown", () => continueHandler());

      const optionTexts: Phaser.GameObjects.Text[] = [];
      const optionBgs: Phaser.GameObjects.Rectangle[] = [];
      let answered = false;

      const yStart = h / 2 - (touch ? 60 : 30);
      q.options.forEach((opt, i) => {
        const y = yStart + i * rowStep;
        const rowW = Math.min(w - 200, touch ? 940 : 720);
        const bg = this.scene.add.rectangle(w / 2, y, rowW, rowH, 0x21262d, 1)
          .setStrokeStyle(1, 0x30363d).setScrollFactor(0).setDepth(302).setInteractive({ useHandCursor: true });
        const t = this.scene.add.text(w / 2, y, `${String.fromCharCode(65 + i)}.  ${opt}`, {
          fontFamily: "system-ui, sans-serif",
          fontSize: `${optionSize}px`,
          color: "#e6edf3",
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303);
        if (t.width > rowW - 24) t.setScale((rowW - 24) / t.width);
        bg.on("pointerover", () => { if (!answered) bg.setFillStyle(0x30363d); });
        bg.on("pointerout", () => { if (!answered) bg.setFillStyle(0x21262d); });
        bg.on("pointerdown", () => choose(i));
        optionTexts.push(t);
        optionBgs.push(bg);
      });

      const numberKeys = ["ONE", "TWO", "THREE", "FOUR", "FIVE"];
      const letterKeys = ["A", "B", "C", "D", "E"];
      const handlers: Array<() => void> = [];
      q.options.forEach((_, i) => {
        const fn = () => choose(i);
        handlers.push(fn);
        this.scene.input.keyboard?.on(`keydown-${numberKeys[i]}`, fn);
        this.scene.input.keyboard?.on(`keydown-${letterKeys[i]}`, fn);
      });
      const continueHandler = () => {
        if (!answered) return;
        cleanup();
        resolve({ wrongCount });
      };
      this.scene.input.keyboard?.on("keydown-SPACE", continueHandler);
      this.scene.input.keyboard?.on("keydown-ENTER", continueHandler);

      const choose = (i: number) => {
        const correct = i === q.correctIndex;
        if (correct) {
          answered = true;
          optionBgs[i].setFillStyle(0x238636);
          feedback.setText(q.successMessage).setColor("#3fb950");
          continueLabel.setVisible(true);
          this.scene.tweens.add({ targets: continueLabel, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
        } else {
          wrongCount += 1;
          optionBgs[i].setFillStyle(0x6e1c2e);
          feedback.setText(q.failureMessage + "\nTry again.").setColor("#ff6b81");
          // Re-enable after a beat
          this.scene.time.delayedCall(900, () => {
            if (!answered) optionBgs[i].setFillStyle(0x21262d);
          });
        }
      };

      const cleanup = () => {
        handlers.forEach((fn, i) => {
          this.scene.input.keyboard?.off(`keydown-${numberKeys[i]}`, fn);
          this.scene.input.keyboard?.off(`keydown-${letterKeys[i]}`, fn);
        });
        this.scene.input.keyboard?.off("keydown-SPACE", continueHandler);
        this.scene.input.keyboard?.off("keydown-ENTER", continueHandler);
        [dim, card, header, prompt, feedback, continueLabel, ...optionBgs, ...optionTexts].forEach((o) => o.destroy());
      };
    });
  }
}
