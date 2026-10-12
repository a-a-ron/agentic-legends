import Phaser from "phaser";

export class CorruptionEnemy extends Phaser.Physics.Arcade.Sprite {
  private patrolMin: number;
  private patrolMax: number;
  private speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, range: number, textureKey?: string, speed = 55) {
    const tex = textureKey ?? ensureTexture(scene);
    super(scene, x, y, tex);
    if (textureKey) {
      this.setDisplaySize(82, 66);
    }
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false);
    this.setBounce(0);
    this.speed = speed;
    this.patrolMin = x - range;
    this.patrolMax = x + range;
    this.setVelocityX(this.speed);
    this.setDepth(9);
  }

  override update() {
    if (this.x < this.patrolMin) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    } else if (this.x > this.patrolMax) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    }
  }
}

function ensureTexture(scene: Phaser.Scene): string {
  const key = "corruption-bug";
  if (scene.textures.exists(key)) return key;
  const W = 64, H = 48;
  const g = scene.add.graphics();

  // Antennae (drawn first, behind body)
  g.lineStyle(2, 0x1f3a1a, 1);
  g.beginPath();
  g.moveTo(24, 18); g.lineTo(18, 6);
  g.moveTo(40, 18); g.lineTo(46, 6);
  g.strokePath();
  g.fillStyle(0x1f3a1a, 1);
  g.fillCircle(18, 6, 2);
  g.fillCircle(46, 6, 2);

  // Legs (six little nubs)
  g.lineStyle(3, 0x1f3a1a, 1);
  g.beginPath();
  g.moveTo(14, 30); g.lineTo(8, 40);
  g.moveTo(20, 34); g.lineTo(16, 44);
  g.moveTo(28, 36); g.lineTo(26, 46);
  g.moveTo(36, 36); g.lineTo(38, 46);
  g.moveTo(44, 34); g.lineTo(48, 44);
  g.moveTo(50, 30); g.lineTo(56, 40);
  g.strokePath();

  // Body (rounded green carapace)
  g.fillStyle(0x2f7d32, 1);
  g.fillEllipse(32, 28, 50, 28);
  g.fillStyle(0x4caf50, 1);
  g.fillEllipse(32, 24, 46, 22);

  // Carapace seam down the middle
  g.lineStyle(2, 0x1b5e20, 1);
  g.beginPath();
  g.moveTo(32, 14); g.lineTo(32, 38);
  g.strokePath();

  // Spots on each wing
  g.fillStyle(0x1b5e20, 1);
  g.fillCircle(22, 24, 3);
  g.fillCircle(42, 24, 3);
  g.fillCircle(26, 32, 2);
  g.fillCircle(38, 32, 2);

  // Head
  g.fillStyle(0x1b5e20, 1);
  g.fillEllipse(32, 16, 22, 14);

  // Eyes — angry, not friendly
  g.fillStyle(0xffffff, 1);
  g.fillCircle(26, 16, 3);
  g.fillCircle(38, 16, 3);
  g.fillStyle(0x000000, 1);
  g.fillCircle(27, 17, 1.6);
  g.fillCircle(39, 17, 1.6);

  // Mandibles
  g.lineStyle(2, 0x000000, 1);
  g.beginPath();
  g.moveTo(28, 22); g.lineTo(26, 26);
  g.moveTo(36, 22); g.lineTo(38, 26);
  g.strokePath();

  g.generateTexture(key, W, H);
  g.destroy();
  return key;
}
