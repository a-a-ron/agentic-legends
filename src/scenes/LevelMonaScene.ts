import { GAME_HEIGHT } from "../config";
import { MENTOR_DIALOG } from "../data/story";
import { BaseLevelScene, type LevelConfig } from "./BaseLevelScene";

export class LevelMonaScene extends BaseLevelScene {
  constructor() { super({ key: "LevelMona" }); }
  config(): LevelConfig {
    const ground = GAME_HEIGHT - 40;
    return {
      key: "LevelMona",
      next: "LevelDucky",
      title: "Forest Archives — find Mona",
      bgKey: "forest-archive-bg",
      bgTint: 0xffffff,
      bgAlpha: 0.9,
      overlayAlpha: 0.12,
      topColor: 0x120a05,
      bottomColor: 0x2e1408,
      worldWidth: 3600,
      enemyTextureKey: "forest-archive-rat",
      enemySpeed: 24,
      enemyName: "rat",
      platforms: [
        { x: 1800, y: ground, w: 3600 },
        { x: 500, y: ground - 140, w: 180 },
        { x: 780, y: ground - 240, w: 160 },
        { x: 1100, y: ground - 160, w: 200 },
        { x: 1500, y: ground - 280, w: 180 },
        { x: 1900, y: ground - 200, w: 220 },
        { x: 2300, y: ground - 320, w: 180 },
        { x: 2700, y: ground - 220, w: 200 },
        { x: 3050, y: ground - 140, w: 200 },
      ],
      enemies: [
        { x: 900, y: ground - 60, range: 120 },
        { x: 1700, y: ground - 60, range: 140 },
        { x: 2500, y: ground - 60, range: 160 },
      ],
      mentor: { x: 3380, y: ground - 80, portraitKey: "mona-portrait" },
      rewardKey: "fork-icon",
      rewardPower: "fork",
      mentorDialog: MENTOR_DIALOG.mona,
      startingPlayerTexture: "adventurer-fork",
    };
  }
}
