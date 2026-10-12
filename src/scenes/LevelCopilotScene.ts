import { GAME_HEIGHT } from "../config";
import { MENTOR_DIALOG } from "../data/story";
import { BaseLevelScene, type LevelConfig } from "./BaseLevelScene";

export class LevelCopilotScene extends BaseLevelScene {
  constructor() { super({ key: "LevelCopilot" }); }
  config(): LevelConfig {
    const ground = GAME_HEIGHT - 40;
    return {
      key: "LevelCopilot",
      next: "BossMainline",
      title: "Sky of the Sacred Tree — find Copilot",
      bgKey: "cloud-background",
      bgAlpha: 0.9,
      overlayAlpha: 0.12,
      topColor: 0x0a1f44,
      bottomColor: 0x6cd0ff,
      worldWidth: 4400,
      platforms: [
        // Three solid floor segments with gaps in between
        { x: 700, y: ground, w: 1400 },
        { x: 2400, y: ground, w: 600 },
        { x: 4000, y: ground, w: 800 },
        // Bridge platforms over gap 1 (1400 → 2100)
        { x: 1500, y: ground - 90, w: 130 },
        { x: 1750, y: ground - 160, w: 130 },
        { x: 2000, y: ground - 90, w: 130 },
        // Bridge platforms over gap 2 (2700 → 3600)
        { x: 2850, y: ground - 90, w: 130 },
        { x: 3100, y: ground - 170, w: 130 },
        { x: 3350, y: ground - 170, w: 130 },
        { x: 3550, y: ground - 90, w: 130 },
        // Higher reward platforms for the daring
        { x: 1600, y: ground - 260, w: 180 },
        { x: 3700, y: ground - 280, w: 180 },
      ],
      hiddenPlatforms: [
        // Replay shortcuts — only visible after collecting Goggles
        { x: 1850, y: ground - 240, w: 160 },
        { x: 3050, y: ground - 280, w: 160 },
      ],
      enemies: [
        { x: 900, y: ground - 60, range: 220 },
        { x: 4250, y: ground - 60, range: 220 },
      ],
      mentor: { x: 4300, y: ground - 80, portraitKey: "copilot-portrait" },
      rewardKey: "goggles-icon",
      rewardPower: "goggles",
      mentorDialog: MENTOR_DIALOG.copilot,
      startingPlayerTexture: "adventurer-goggles",
      fatalFall: true,
      hideRewardCaption: true,
      lavaPits: [
        { x: 1750, y: GAME_HEIGHT - 20, w: 700, h: 40 },
        { x: 3150, y: GAME_HEIGHT - 20, w: 900, h: 40 },
      ],
    };
  }
}
