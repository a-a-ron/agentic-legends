import Phaser from "phaser";
import { Adventurer, type Power } from "../entities/Adventurer";
import { CorruptionEnemy } from "../entities/CorruptionEnemy";
import { Mentor } from "../entities/Mentor";
import { Hud } from "../systems/Hud";
import { DialogBox } from "../systems/DialogBox";
import { AudioBus } from "../systems/AudioBus";
import { Quiz } from "../systems/Quiz";
import { showRewardModal } from "../systems/RewardModal";
import { QUIZZES } from "../data/quizzes";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { TouchControls } from "../systems/TouchControls";

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
}

export interface LevelConfig {
  key: string;
  next: string;
  title: string;
  bgKey: string;
  bgTint: number;
  topColor: number;
  bottomColor: number;
  worldWidth: number;
  platforms: PlatformDef[];
  enemies: Array<{ x: number; y: number; range: number }>;
  hiddenPlatforms?: PlatformDef[]; // visible only with "goggles"
  fogBlocks?: PlatformDef[];       // walls that block path until "bubbles"
  lavaPits?: Array<{ x: number; y: number; w: number; h: number }>;
  fatalFall?: boolean;             // falling off the world ends the run
  hideRewardCaption?: boolean;     // poster contains its own text — skip caption
  mentor: { x: number; y: number; portraitKey: string; cropTopFraction?: number };
  rewardKey: string;
  rewardPower: Power;
  mentorDialog: string[];
  startingPlayerTexture: string;
  bgMusic?: number[];
}

export abstract class BaseLevelScene extends Phaser.Scene {
  protected player!: Adventurer;
  protected platforms!: Phaser.Physics.Arcade.StaticGroup;
  protected enemies!: Phaser.Physics.Arcade.Group;
  protected mentor!: Mentor;
  protected hud!: Hud;
  protected dialog!: DialogBox;
  protected reward?: Phaser.Physics.Arcade.Sprite;
  protected hiddenGroup!: Phaser.Physics.Arcade.StaticGroup;
  protected fogGroup!: Phaser.Physics.Arcade.StaticGroup;
  protected lavaZones!: Phaser.Physics.Arcade.StaticGroup;
  protected escKey!: Phaser.Input.Keyboard.Key;
  protected muteKey!: Phaser.Input.Keyboard.Key;
  protected pauseOverlay?: Phaser.GameObjects.Container;
  protected isPaused = false;
  protected mentorTriggered = false;
  protected goalReached = false;

  abstract config(): LevelConfig;

  protected initialPowers(): Power[] {
    return (this.scene.settings.data as { powers?: Power[] })?.powers ?? [];
  }
  protected initialHearts(): number {
    return (this.scene.settings.data as { hearts?: number })?.hearts ?? 3;
  }
  protected initialWrongAnswers(): number {
    return (this.scene.settings.data as { wrongAnswers?: number })?.wrongAnswers ?? 0;
  }
  protected wrongAnswers = 0;

  create() {
    // Reset per-run state — class field initializers only fire once per scene
    // instance, but Phaser reuses the same instance on `scene.restart()`.
    this.mentorTriggered = false;
    this.goalReached = false;
    this.isPaused = false;
    this.pauseOverlay = undefined;
    this.reward = undefined;

    const cfg = this.config();
    this.physics.world.setBounds(0, 0, cfg.worldWidth, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, cfg.worldWidth, GAME_HEIGHT);

    this.drawBackground(cfg);

    this.platforms = this.physics.add.staticGroup();
    for (const p of cfg.platforms) {
      this.makePlatform(p, 0x4a5568, 0x2d3748);
    }

    this.hiddenGroup = this.physics.add.staticGroup();
    for (const p of cfg.hiddenPlatforms ?? []) {
      const rect = this.makePlatform(p, 0x6cd0ff, 0x1a4a6e);
      rect.setAlpha(0);
      rect.body.enable = false;
    }

    this.fogGroup = this.physics.add.staticGroup();
    for (const p of cfg.fogBlocks ?? []) {
      this.makePlatform(p, 0xb6c2cf, 0x4a5568);
    }

    this.lavaZones = this.physics.add.staticGroup();
    for (const pit of cfg.lavaPits ?? []) {
      this.drawLavaPit(pit.x, pit.y, pit.w, pit.h);
    }

    this.enemies = this.physics.add.group();
    for (const e of cfg.enemies) {
      const enemy = new CorruptionEnemy(this, e.x, e.y, e.range);
      this.enemies.add(enemy);
    }
    // Penalty bugs from previously-missed knowledge checks.
    this.wrongAnswers = this.initialWrongAnswers();
    this.spawnPenaltyBugs(cfg, this.wrongAnswers);
    this.physics.add.collider(this.enemies, this.platforms);

    const playerTex = this.pickPlayerTexture(cfg);
    this.player = new Adventurer(this, 80, GAME_HEIGHT - 200, playerTex);
    for (const p of this.initialPowers()) this.player.grantPower(p);
    this.player.hearts = this.initialHearts();

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.fogGroup);
    this.physics.add.collider(this.player, this.hiddenGroup);
    this.physics.add.overlap(this.player, this.enemies, () => this.onHit(), undefined, this);
    this.physics.add.overlap(this.player, this.lavaZones, () => this.onLavaTouch(), undefined, this);

    this.mentor = new Mentor(this, cfg.mentor.x, cfg.mentor.y, cfg.mentor.portraitKey, cfg.mentor.cropTopFraction);
    this.physics.add.overlap(this.player, this.mentor, () => this.onMentor(), undefined, this);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.hud = new Hud(this, cfg.title, { showLeapTip: cfg.key === "LevelCopilot" });
    this.hud.setHearts(this.player.hearts);
    this.hud.setPowers(this.player.powers);
    new TouchControls(this).attach();
    this.dialog = new DialogBox(this);

    this.escKey = this.input.keyboard!.addKey("ESC");
    this.muteKey = this.input.keyboard!.addKey("M");
    this.input.keyboard!.on("keydown-ESC", () => this.togglePause());
    this.input.keyboard!.on("keydown-M", () => {
      const m = AudioBus.toggleMute();
      this.hud.flashTitle(m ? `${cfg.title}  (muted)` : cfg.title);
    });
    this.input.keyboard!.on("keydown-R", () => {
      AudioBus.stopBackground();
      this.scene.restart({
        powers: this.initialPowers(),
        hearts: this.initialHearts(),
      });
    });
    this.input.keyboard!.on("keydown-Q", () => {
      AudioBus.stopBackground();
      this.scene.start("Title");
    });

    AudioBus.startBackground(cfg.bgMusic);

    // Goggles reveal
    this.events.on("update", () => {
      const reveal = this.player.powers.has("goggles");
      this.hiddenGroup.children.iterate((c) => {
        const r = c as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody };
        r.setAlpha(reveal ? 1 : 0);
        r.body.enable = reveal;
        return true;
      });
      // Bubbles dissolve fog
      if (this.player.powers.has("bubbles")) {
        this.fogGroup.children.iterate((c) => {
          const r = c as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody };
          r.setAlpha(0);
          r.body.enable = false;
          return true;
        });
      }
    });
  }

  protected pickPlayerTexture(_cfg: LevelConfig): string {
    // The player now uses a single animated spritesheet; powers are shown via
    // badge overlays rather than texture swaps. Fall back to the level's
    // configured texture if the spritesheet failed to load.
    if (this.textures.exists("adventurer-walk")) return "adventurer-walk";
    return _cfg.startingPlayerTexture;
  }

  protected makePlatform(p: PlatformDef, top: number, bottom: number) {
    const rect = this.add.rectangle(p.x, p.y, p.w, 28, top).setStrokeStyle(2, bottom);
    this.physics.add.existing(rect, true);
    this.platforms.add(rect);
    return rect as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody };
  }

  protected drawBackground(cfg: LevelConfig) {
    if (cfg.bgKey && this.textures.exists(cfg.bgKey)) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, cfg.bgKey);
      const scale = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
      bg.setScale(scale).setAlpha(0.35).setScrollFactor(0.2).setTint(cfg.bgTint);
    }
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(cfg.topColor, cfg.topColor, cfg.bottomColor, cfg.bottomColor, 0.35);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setScrollFactor(0);
  }

  override update() {
    if (this.isPaused) return;
    this.player.update();
    this.enemies.children.iterate((e) => { (e as CorruptionEnemy).update(); return true; });
    if (this.player.y > GAME_HEIGHT + 60) this.onFall();
  }

  protected onHit() {
    if (this.player.damage(this.time.now)) {
      AudioBus.hit();
      this.cameras.main.shake(180, 0.012);
      this.cameras.main.flash(120, 255, 60, 60, false);
      this.hud.setHearts(this.player.hearts);
      if (this.player.hearts <= 0) this.gameOver();
    }
  }

  protected onFall() {
    const cfg = this.config();
    if (cfg.fatalFall) {
      this.player.hearts = 0;
      AudioBus.hit();
      this.hud.setHearts(0);
      this.gameOver();
      return;
    }
    this.player.hearts = Math.max(0, this.player.hearts - 1);
    AudioBus.hit();
    this.hud.setHearts(this.player.hearts);
    if (this.player.hearts <= 0) {
      this.gameOver();
    } else {
      this.player.setPosition(80, GAME_HEIGHT - 200);
      this.player.setVelocity(0, 0);
    }
  }

  protected drawLavaPit(x: number, y: number, w: number, h: number) {
    const base = this.add.rectangle(x, y, w, h, 0xff5722).setDepth(-1);
    base.setStrokeStyle(2, 0xffb347);
    // Hit zone — overlap with player triggers fatal fall.
    const zone = this.add.rectangle(x, y - h / 2 + 2, w, Math.max(8, h / 2));
    zone.setVisible(false);
    this.physics.add.existing(zone, true);
    this.lavaZones.add(zone);
    const glow = this.add.rectangle(x, y - h / 2 + 4, w - 8, 6, 0xffd166, 0.85).setDepth(-1);
    this.tweens.add({ targets: glow, alpha: 0.35, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const count = Math.max(2, Math.round(w / 220));
    for (let i = 0; i < count; i++) {
      const bx = x - w / 2 + (w / (count + 1)) * (i + 1);
      const bubble = this.add.circle(bx, y - h / 2 + 10, 5, 0xffe066, 0.9).setDepth(-1);
      this.tweens.add({
        targets: bubble,
        y: y - h / 2 - 6,
        alpha: 0.2,
        duration: 900 + i * 180,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 220,
      });
    }
  }

  protected onLavaTouch() {
    if (this.goalReached) return;
    this.player.hearts = 0;
    AudioBus.hit();
    this.hud.setHearts(0);
    this.cameras.main.shake(250, 0.02);
    this.cameras.main.flash(220, 255, 90, 30);
    this.gameOver();
  }

  protected async onMentor() {
    if (this.mentorTriggered) return;
    this.mentorTriggered = true;
    const cfg = this.config();
    this.player.setVelocity(0, 0);
    this.physics.pause();

    await this.dialog.show(cfg.mentorDialog, cfg.mentor.portraitKey);

    const reward = this.physics.add.sprite(this.mentor.x, this.mentor.y - 80, cfg.rewardKey);
    if (this.textures.exists(cfg.rewardKey)) {
      const targetH = 100;
      reward.setScale(targetH / reward.height);
    }
    (reward.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.tweens.add({ targets: reward, y: reward.y - 14, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.physics.resume();

    this.physics.add.overlap(this.player, reward, () => {
      if (this.goalReached) return;
      this.goalReached = true;
      AudioBus.collect();
      this.spawnSparkleBurst(reward.x, reward.y);
      reward.destroy();
      this.player.grantPower(cfg.rewardPower);
      this.hud.setPowers(this.player.powers);
      this.cameras.main.flash(300, 255, 220, 100);
      this.physics.pause();
      this.time.delayedCall(450, () => this.runEndOfLevel());
    });
  }

  protected spawnSparkleBurst(x: number, y: number, count: number = 24) {
    if (!this.textures.exists("particle-sparkle")) return;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 80 + Math.random() * 160;
      const p = this.add.image(x, y, "particle-sparkle").setDepth(200);
      p.setScale(0.8 + Math.random() * 0.8);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        rotation: Math.random() * 4,
        duration: 500 + Math.random() * 300,
        ease: "Cubic.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  private async runEndOfLevel() {
    const cfg = this.config();
    AudioBus.stopBackground();
    const captions: Record<Power, string> = {
      fork: "Fork of Curiosity acquired",
      bubbles: "Bubbles of Clarity acquired",
      goggles: "Goggles of Insight acquired",
    };
    const caption = cfg.hideRewardCaption ? undefined : captions[cfg.rewardPower];
    await showRewardModal(this, cfg.bgKey, caption);

    const q = QUIZZES[cfg.key];
    if (q) {
      const quiz = new Quiz(this);
      const { wrongCount } = await quiz.show(q);
      this.wrongAnswers += wrongCount;
    }
    this.advanceLevel();
  }

  protected advanceLevel() {
    AudioBus.stopBackground();
    const cfg = this.config();
    this.scene.start(cfg.next, {
      powers: Array.from(this.player.powers),
      hearts: this.player.hearts,
      wrongAnswers: this.wrongAnswers,
    });
  }

  /**
   * Spawn N extra "penalty" bugs scattered around the level for each
   * knowledge-check answer the player has missed so far. Surfaces a HUD
   * banner so the player understands why the level got harder.
   */
  protected spawnPenaltyBugs(cfg: LevelConfig, count: number) {
    if (count <= 0) return;
    const ground = GAME_HEIGHT - 40;
    const margin = 200;
    const span = Math.max(400, cfg.worldWidth - margin * 2);
    for (let i = 0; i < count; i++) {
      const x = margin + ((i + 1) * span) / (count + 1);
      const range = 160 + (i % 3) * 60;
      const enemy = new CorruptionEnemy(this, x, ground - 60, range);
      this.enemies.add(enemy);
    }
    this.time.delayedCall(400, () => {
      const noun = count === 1 ? "bug" : "bugs";
      this.hud.flashWarning(`⚠ ${count} extra ${noun} from missed knowledge checks!`);
    });
  }

  protected gameOver() {
    AudioBus.stopBackground();
    const cfg = this.config();
    this.scene.start("GameOver", { from: cfg.key });
  }

  protected togglePause() {
    if (this.isPaused) {
      this.isPaused = false;
      this.physics.resume();
      this.pauseOverlay?.destroy(true);
      this.pauseOverlay = undefined;
    } else {
      this.isPaused = true;
      this.physics.pause();
      const w = this.scale.width, h = this.scale.height;
      const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.55).setScrollFactor(0).setDepth(200);
      const txt = this.add.text(w / 2, h / 2, "Paused\n(Esc to resume • M to mute)", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "32px",
        color: "#e6edf3",
        align: "center",
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
      this.pauseOverlay = this.add.container(0, 0, [overlay, txt]).setScrollFactor(0).setDepth(200);
    }
  }
}
