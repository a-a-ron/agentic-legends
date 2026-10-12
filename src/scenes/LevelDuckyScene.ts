import { GAME_HEIGHT } from "../config";
import { MENTOR_DIALOG } from "../data/story";
import { BaseLevelScene, type LevelConfig } from "./BaseLevelScene";

export class LevelDuckyScene extends BaseLevelScene {
  constructor() { super({ key: "LevelDucky" }); }
  config(): LevelConfig {
    const ground = GAME_HEIGHT - 40;
    return {
      key: "LevelDucky",
      next: "LevelCopilot",
      title: "Frozen River — find Ducky",
      bgKey: "enchanted-forest",
      bgAlpha: 0.9,
      overlayAlpha: 0.12,
      topColor: 0x102a43,
      bottomColor: 0x3aa0ff,
      worldWidth: 4000,
      platforms: [
        { x: 2000, y: ground, w: 4000 },
        { x: 500, y: ground - 160, w: 160 },
        { x: 800, y: ground - 280, w: 140 },
        { x: 1150, y: ground - 200, w: 180 },
        { x: 1600, y: ground - 340, w: 160 },
        { x: 2050, y: ground - 220, w: 200 },
        { x: 2500, y: ground - 320, w: 180 },
        { x: 2950, y: ground - 200, w: 200 },
        { x: 3350, y: ground - 140, w: 220 },
      ],
      enemies: [
        { x: 1000, y: ground - 60, range: 140 },
        { x: 2200, y: ground - 60, range: 200 },
        { x: 3000, y: ground - 60, range: 180 },
      ],
      fogBlocks: [
        { x: 1380, y: ground - 14, w: 60 },
        { x: 1380, y: ground - 60, w: 60 },
        { x: 2750, y: ground - 14, w: 80 },
        { x: 2750, y: ground - 60, w: 80 },
        { x: 2750, y: ground - 110, w: 80 },
      ],
      mentor: { x: 3750, y: ground - 80, portraitKey: "ducky-portrait" },
      rewardKey: "bubbles-icon",
      rewardPower: "bubbles",
      mentorDialog: MENTOR_DIALOG.ducky,
      startingPlayerTexture: "adventurer-bubbles",
      hideRewardCaption: true,
    };
  }
}
