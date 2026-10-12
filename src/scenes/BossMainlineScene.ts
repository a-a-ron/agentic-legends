import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { Adventurer, type Power } from "../entities/Adventurer";
import { CorruptionEnemy } from "../entities/CorruptionEnemy";
import { Hud } from "../systems/Hud";
import { AudioBus } from "../systems/AudioBus";
import { TouchControls } from "../systems/TouchControls";

/**
 * Final stand on the Mainline. The Copilot Orb hovers at the end of the
 * arena — touching it restores the sacred Mainline and triggers victory.
 * Roaming corruption bugs (plus penalty bugs from missed knowledge checks)
 * still try to stop you on the way.
 */
export class BossMainlineScene extends Phaser.Scene {
  private player!: Adventurer;
  private hud!: Hud;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private orb?: Phaser.Physics.Arcade.Sprite;
  private orbTouched = false;
  private wrongAnswers = 0;

  constructor() { super("BossMainline"); }

  init(data: { powers?: Power[]; hearts?: number; wrongAnswers?: number }) {
    this.orbTouched = false;
    this.wrongAnswers = data.wrongAnswers ?? 0;
    (this as unknown as { initData: { powers: Power[]; hearts: number } }).initData = {
      powers: data.powers ?? [],
      hearts: data.hearts ?? 3,
    };
  }

  create() {
    const data = (this as unknown as { initData: { powers: Power[]; hearts: number } }).initData;

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x3a0d24, 0x3a0d24, 0xb02a55, 0xb02a55, 0.5);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setScrollFactor(0);
    overlay.setDepth(-10);

    this.platforms = this.physics.add.staticGroup();
    const ground = GAME_HEIGHT - 40;
    this.makeRect(GAME_WIDTH / 2, ground, GAME_WIDTH, 28, 0x4a5568);
    this.makeRect(280, ground - 180, 180, 28, 0x4a5568);
    this.makeRect(560, ground - 300, 180, 28, 0x4a5568);
    this.makeRect(900, ground - 220, 180, 28, 0x4a5568);

    const playerTex = this.textures.exists("adventurer-walk") ? "adventurer-walk" : "adventurer-fork";

    this.player = new Adventurer(this, 80, GAME_HEIGHT - 200, playerTex);
    for (const p of data.powers) this.player.grantPower(p);
    this.player.hearts = data.hearts;
    this.physics.add.collider(this.player, this.platforms);

    this.enemies = this.physics.add.group();
    const baseEnemies: Array<{ x: number; y: number; range: number }> = [
      { x: 360, y: ground - 60, range: 200 },
      { x: 720, y: ground - 60, range: 220 },
    ];
    for (const e of baseEnemies) this.enemies.add(new CorruptionEnemy(this, e.x, e.y, e.range));
    this.spawnPenaltyBugs(this.wrongAnswers, ground);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, () => this.onHit(), undefined, this);

    // The Copilot Orb — touch to win.
    const orbX = GAME_WIDTH - 160;
    const orbY = GAME_HEIGHT - 240;

    // Soft halo behind the orb (drawn first; depth just under orb).
    const halo = this.add.circle(orbX, orbY, 90, 0x6cd0ff, 0.35).setDepth(9);
    this.tweens.add({ targets: halo, scale: 1.2, alpha: 0.6, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    if (this.textures.exists("copilot-orb")) {
      this.orb = this.physics.add.sprite(orbX, orbY, "copilot-orb");
      const targetH = 160;
      this.orb.setScale(targetH / this.orb.height);
    } else {
      // Fallback if asset missing — visible blue circle so the goal is reachable.
      const fallbackTex = this.make.graphics({ x: 0, y: 0 }, false);
      fallbackTex.fillStyle(0x6c63ff, 1);
      fallbackTex.fillCircle(60, 60, 56);
      fallbackTex.fillStyle(0x6cd0ff, 1);
      fallbackTex.fillCircle(40, 50, 8);
      fallbackTex.fillCircle(80, 50, 8);
      fallbackTex.generateTexture("copilot-orb-fallback", 120, 120);
      fallbackTex.destroy();
      this.orb = this.physics.add.sprite(orbX, orbY, "copilot-orb-fallback");
    }
    this.orb.setDepth(10);
    (this.orb.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (this.orb.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    this.tweens.add({ targets: this.orb, y: orbY - 16, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: halo, y: orbY - 16, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // Ambient floating energy around Copilot Orb
    if (this.textures.exists("particle-sparkle")) {
      this.add.particles(orbX, orbY, "particle-sparkle", {
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.8, end: 0 },
        speed: { min: 20, max: 60 },
        lifespan: { min: 600, max: 1200 },
        frequency: 180,
        blendMode: Phaser.BlendModes.ADD,
      }).setDepth(12);
    }

    this.physics.add.overlap(this.player, this.orb, () => this.onOrbTouch(), undefined, this);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.hud = new Hud(this, "Mainline Corruption — final stand");
    this.hud.setHearts(this.player.hearts);
    this.hud.setPowers(this.player.powers);
    new TouchControls(this).attach();

    if (this.wrongAnswers > 0) {
      this.time.delayedCall(400, () => {
        const noun = this.wrongAnswers === 1 ? "bug" : "bugs";
        this.hud.flashWarning(`⚠ ${this.wrongAnswers} extra ${noun} from missed knowledge checks!`);
      });
    }

    this.add.text(GAME_WIDTH / 2, 60, "Reach the Copilot Orb to restore the Mainline", {
      fontFamily: "Georgia, serif",
      fontSize: "20px",
      color: "#e6edf3",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    this.input.keyboard!.on("keydown-ESC", () => this.scene.pause());
    this.input.keyboard!.on("keydown-M", () => AudioBus.toggleMute());
    this.input.keyboard!.on("keydown-R", () => {
      AudioBus.stopBackground();
      this.scene.restart({ powers: data.powers, hearts: data.hearts, wrongAnswers: this.wrongAnswers });
    });
    this.input.keyboard!.on("keydown-Q", () => {
      AudioBus.stopBackground();
      this.scene.start("Title");
    });

    AudioBus.startBackground();
  }

  private makeRect(x: number, y: number, w: number, h: number, color: number) {
    const r = this.add.rectangle(x, y, w, h, color).setStrokeStyle(2, 0x2d3748);
    this.physics.add.existing(r, true);
    this.platforms.add(r);
    return r;
  }

  private spawnPenaltyBugs(count: number, ground: number) {
    if (count <= 0) return;
    const margin = 200;
    const span = Math.max(400, GAME_WIDTH - margin * 2);
    for (let i = 0; i < count; i++) {
      const x = margin + ((i + 1) * span) / (count + 1);
      const range = 160 + (i % 3) * 60;
      this.enemies.add(new CorruptionEnemy(this, x, ground - 60, range));
    }
  }

  override update() {
    this.player.update();
    this.enemies.children.iterate((e) => { (e as CorruptionEnemy).update(); return true; });
    if (this.player.y > GAME_HEIGHT + 60) {
      this.player.hearts = Math.max(0, this.player.hearts - 1);
      AudioBus.hit();
      this.hud.setHearts(this.player.hearts);
      if (this.player.hearts <= 0) return this.gameOver();
      this.player.setPosition(80, GAME_HEIGHT - 200);
      this.player.setVelocity(0, 0);
    }
  }

  private onHit() {
    if (this.orbTouched) return;
    if (this.player.damage(this.time.now)) {
      AudioBus.hit();
      this.cameras.main.shake(180, 0.012);
      this.cameras.main.flash(120, 255, 60, 60, false);
      this.hud.setHearts(this.player.hearts);
      if (this.player.hearts <= 0) this.gameOver();
    }
  }

  private onOrbTouch() {
    if (this.orbTouched) return;
    this.orbTouched = true;
    AudioBus.collect();
    this.cameras.main.shake(300, 0.02);
    this.cameras.main.flash(400, 200, 230, 255);
    if (this.textures.exists("particle-sparkle")) {
      const orbX = GAME_WIDTH - 160;
      const orbY = GAME_HEIGHT - 240;
      for (let i = 0; i < 36; i++) {
        const angle = (i / 36) * Math.PI * 2;
        const speed = 100 + Math.random() * 200;
        const p = this.add.image(orbX, orbY, "particle-sparkle").setDepth(200);
        this.tweens.add({
          targets: p,
          x: orbX + Math.cos(angle) * speed,
          y: orbY + Math.sin(angle) * speed,
          alpha: 0,
          scale: 0.1,
          duration: 600 + Math.random() * 300,
          ease: "Cubic.easeOut",
          onComplete: () => p.destroy(),
        });
      }
    }
    this.physics.pause();
    this.time.delayedCall(450, () => this.win());
  }

  private win() {
    AudioBus.victory();
    AudioBus.stopBackground();
    this.scene.start("Victory");
  }
  private gameOver() {
    AudioBus.stopBackground();
    this.scene.start("GameOver", { from: "BossMainline" });
  }
}
