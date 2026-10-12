import Phaser from "phaser";
import { PHYSICS } from "../config";
import { AudioBus } from "../systems/AudioBus";
import { getTouchInput, type TouchInputState } from "../systems/TouchControls";

export type Power = "fork" | "bubbles" | "goggles";

const POWER_BADGE_KEY: Record<Power, string> = {
  fork: "fork-icon",
  bubbles: "bubbles-icon",
  goggles: "goggles-icon",
};

interface PlayerInputs {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  altLeft: Phaser.Input.Keyboard.Key;
  altRight: Phaser.Input.Keyboard.Key;
  altJump: Phaser.Input.Keyboard.Key;
  sprint: Phaser.Input.Keyboard.Key;
  altSprint: Phaser.Input.Keyboard.Key;
}

export class Adventurer extends Phaser.Physics.Arcade.Sprite {
  powers: Set<Power> = new Set();
  hearts = 3;
  invulnerableUntil = 0;
  private inputs!: PlayerInputs;
  private touch: TouchInputState;
  private jumpsRemaining = 1;
  private jumpHeld = false;
  private badges?: Phaser.GameObjects.Container;
  private lastJumpTapAt = -1000;
  private facingRight = true;
  private wasOnFloor = true;
  private prevVy = 0;

  // Natural facing direction of each animation's source frames. Walk frames
  // were drawn facing right; idle frames were drawn facing left; jump/fall
  // frames were drawn facing right.
  private static readonly ANIM_NATURAL_FACING: Record<string, "left" | "right"> = {
    "adventurer-walk": "right",
    "adventurer-idle": "left",
    "adventurer-jump": "right",
    "adventurer-fall": "right",
  };

  // Display-space targets so visuals stay consistent across walk/idle
  // textures, which have different native frame sizes.
  private static readonly TARGET_DISPLAY_HEIGHT = 160;
  private static readonly TARGET_BODY_WIDTH = 36;
  private static readonly TARGET_BODY_HEIGHT = 110;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.5);
    this.setDepth(10);
    if (scene.textures.exists(textureKey)) {
      scene.textures.get(textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    if (scene.textures.exists("adventurer-idle")) {
      scene.textures.get("adventurer-idle").setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    if (scene.textures.exists("adventurer-jump")) {
      scene.textures.get("adventurer-jump").setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.applySpriteFit();
    if (scene.anims.exists("adventurer-walk")) {
      this.setFrame(0);
    }

    this.badges = scene.add.container(x, y).setDepth(this.depth + 1);

    const kb = scene.input.keyboard!;
    this.inputs = {
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jump: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      altLeft: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      altRight: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      altJump: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      sprint: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      altSprint: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
    };
    this.touch = getTouchInput(scene);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.badges?.destroy();
      this.badges = undefined;
    });
  }

  /**
   * Recompute scale and physics body so the displayed sprite stays a
   * consistent size and the collision box stays consistent on screen,
   * regardless of which animation's frames are currently playing
   * (walk frames are 76×116; idle frames are 128×124).
   */
  private applySpriteFit() {
    const frameH = this.frame.height || this.height || 1;
    const frameW = this.frame.width || this.width || 1;
    const scale = Adventurer.TARGET_DISPLAY_HEIGHT / frameH;
    this.setScale(scale);
    // setSize takes texture-space pixels; convert from display-space targets.
    const bodyW = Adventurer.TARGET_BODY_WIDTH / scale;
    const bodyH = Adventurer.TARGET_BODY_HEIGHT / scale;
    this.setSize(bodyW, bodyH);
    // Bottom-anchor the body to the visible feet rather than re-centring it,
    // so the player's standing point doesn't jump when the texture switches.
    const offsetX = (frameW - bodyW) / 2;
    const offsetY = frameH - bodyH;
    this.setOffset(offsetX, offsetY);
  }

  /**
   * Select walk vs. idle vs. jump/fall based on motion + ground state + vy.
   */
  private updateAnimationState(moving: boolean, sprinting: boolean, onFloor: boolean) {
    const anims = this.scene.anims;
    const hasWalk = anims.exists("adventurer-walk");
    const hasIdle = anims.exists("adventurer-idle");
    const hasJump = anims.exists("adventurer-jump");
    const hasFall = anims.exists("adventurer-fall");
    if (!hasWalk && !hasIdle && !hasJump) return;

    let desired: string | null;
    if (!onFloor) {
      const vy = this.body?.velocity.y ?? 0;
      // Small dead-zone around apex avoids flicker between jump and fall.
      const rising = vy < -40;
      if (rising && hasJump) desired = "adventurer-jump";
      else if (!rising && hasFall) desired = "adventurer-fall";
      else if (hasJump) desired = "adventurer-jump";
      else {
        // Asset missing: fall back to freezing the ground anim mid-air.
        if (this.anims.isPlaying) this.anims.pause();
        return;
      }
    } else {
      desired = moving && hasWalk ? "adventurer-walk"
              : hasIdle ? "adventurer-idle"
              : hasWalk ? "adventurer-walk"
              : null;
    }
    if (!desired) return;

    const current = this.anims.currentAnim?.key;
    if (current !== desired || (!this.anims.isPlaying && desired !== "adventurer-jump")) {
      // For jump (non-looping) we don't want to restart it every tick once it
      // has played out — the `current !== desired` guard handles that.
      this.anims.play({ key: desired, repeat: desired === "adventurer-jump" ? 0 : -1 }, true);
      this.applySpriteFit();
    } else if (this.anims.isPaused) {
      this.anims.resume();
    }
    // Sprint speed-up applies to walk only.
    this.anims.timeScale = desired === "adventurer-walk" && sprinting ? 1.5 : 1;

    // Mirror the sprite if its source faces opposite the current direction.
    const natural = Adventurer.ANIM_NATURAL_FACING[desired] ?? "right";
    const naturalRight = natural === "right";
    this.setFlipX(this.facingRight !== naturalRight);
  }

  /**
   * Kept for backwards compatibility — power state is now communicated via
   * overlay badges, not texture swaps. No-op.
   */
  setTextureForPower(_scene: Phaser.Scene) {
    /* no-op */
  }

  grantPower(p: Power) {
    this.powers.add(p);
    this.refreshBadges();
  }

  private refreshBadges() {
    if (!this.badges) return;
    this.badges.removeAll(true);
    const owned: Power[] = (["fork", "bubbles", "goggles"] as const).filter((p) => this.powers.has(p));
    const badgeSize = 22;
    const gap = 4;
    const totalW = owned.length * badgeSize + Math.max(0, owned.length - 1) * gap;
    let x = -totalW / 2 + badgeSize / 2;
    for (const p of owned) {
      const key = POWER_BADGE_KEY[p];
      if (!this.scene.textures.exists(key)) continue;
      const icon = this.scene.add.image(x, 0, key);
      icon.setDisplaySize(badgeSize, badgeSize);
      this.badges.add(icon);
      x += badgeSize + gap;
    }
  }

  damage(now: number): boolean {
    if (now < this.invulnerableUntil) return false;
    this.hearts -= 1;
    this.invulnerableUntil = now + 1200;
    this.setVelocityY(-300);
    this.setVelocityX(this.flipX ? 240 : -240);
    this.spawnFloatingText("-1 ♥", "#ff6b81");
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.2, to: 1 },
      duration: 200,
      repeat: 5,
    });
    return true;
  }

  override update() {
    const left = this.inputs.left.isDown || this.inputs.altLeft.isDown || this.touch.left;
    const right = this.inputs.right.isDown || this.inputs.altRight.isDown || this.touch.right;
    const jumpDown = this.inputs.jump.isDown || this.inputs.altJump.isDown || this.touch.jump;
    const sprinting = this.inputs.sprint.isDown || this.inputs.altSprint.isDown;

    const speed = sprinting ? PHYSICS.playerSpeed * 1.6 : PHYSICS.playerSpeed;
    if (left) {
      this.setVelocityX(-speed);
      this.facingRight = false;
    } else if (right) {
      this.setVelocityX(speed);
      this.facingRight = true;
    } else {
      this.setVelocityX(0);
    }

    // Drive walk/idle animation from horizontal velocity + ground state.
    const moving = Math.abs(this.body?.velocity.x ?? 0) > 5;
    const onFloor = !!(this.body?.blocked.down || this.body?.touching.down);
    this.updateAnimationState(moving, sprinting, onFloor);

    if (this.badges) {
      this.badges.setPosition(this.x, this.y - this.displayHeight / 2 - 14);
      this.badges.setAlpha(this.alpha);
    }

    if (onFloor) {
      this.jumpsRemaining = this.powers.has("fork") ? 2 : 1;
    }

    const justPressedJump = jumpDown && !this.jumpHeld;
    if (justPressedJump) {
      const now = this.scene.time.now;
      const dt = now - this.lastJumpTapAt;
      const vy = this.body?.velocity.y ?? 0;
      let jumped = false;
      // Double-tap Space leap: a quick second tap while rising (or right at
      // takeoff) supercharges the jump to ~1.55x without consuming an extra
      // jump charge — the discoverable trick to reach high platforms.
      if (dt < 260 && vy < 0) {
        this.setVelocityY(PHYSICS.jumpVelocity * 1.55);
        this.scene.tweens.add({
          targets: this,
          scale: { from: this.scale * 1.1, to: this.scale },
          duration: 220,
        });
        AudioBus.doubleJump();
        this.spawnFloatingText("LEAP!", "#6cd0ff");
        this.spawnDust(this.x, this.y + this.displayHeight / 2 - 4, 4);
        jumped = true;
      } else if (this.jumpsRemaining > 0) {
        const isDouble = this.jumpsRemaining === 1 && this.powers.has("fork");
        const baseV = this.jumpsRemaining === 2 ? PHYSICS.jumpVelocity : PHYSICS.doubleJumpVelocity;
        const v = sprinting ? baseV * 1.15 : baseV;
        this.setVelocityY(v);
        this.jumpsRemaining -= 1;
        if (isDouble) {
          AudioBus.doubleJump();
        } else {
          AudioBus.jump();
        }
        this.spawnDust(this.x, this.y + this.displayHeight / 2 - 4, 3);
        jumped = true;
      }
      // Restart the jump anim from frame 0 on every successful jump trigger
      // (including the airborne double-jump and the leap), so the launch
      // pose syncs with the input.
      if (jumped && this.scene.anims.exists("adventurer-jump")) {
        this.anims.play({ key: "adventurer-jump", repeat: 0 });
        this.applySpriteFit();
        const natural = Adventurer.ANIM_NATURAL_FACING["adventurer-jump"] ?? "right";
        this.setFlipX(this.facingRight !== (natural === "right"));
      }
      this.lastJumpTapAt = now;
    }

    // Cut the jump short if the player releases space early (variable jump).
    if (!jumpDown && (this.body?.velocity.y ?? 0) < -180) {
      this.setVelocityY((this.body?.velocity.y ?? 0) * 0.5);
    }
    this.jumpHeld = jumpDown;

    // Landing dust puff & audio
    const currentVy = this.body?.velocity.y ?? 0;
    if (!this.wasOnFloor && onFloor && this.prevVy > 160) {
      this.spawnDust(this.x, this.y + this.displayHeight / 2 - 4, 5);
      AudioBus.land();
    }
    if (sprinting && moving && onFloor && Math.random() < 0.2) {
      this.spawnDust(this.x + (this.facingRight ? -14 : 14), this.y + this.displayHeight / 2 - 4, 1);
    }
    this.wasOnFloor = onFloor;
    this.prevVy = currentVy;
  }

  private spawnDust(x: number, y: number, count: number = 3) {
    if (!this.scene.textures.exists("particle-dust")) return;
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.image(x + (Math.random() - 0.5) * 16, y, "particle-dust");
      p.setAlpha(0.65).setScale(0.8 + Math.random() * 0.5).setDepth(this.depth - 1);
      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 28,
        y: p.y - 4 - Math.random() * 10,
        alpha: 0,
        scale: 0.2,
        duration: 320 + Math.random() * 180,
        onComplete: () => p.destroy(),
      });
    }
  }

  private spawnFloatingText(text: string, color: string) {
    const t = this.scene.add.text(this.x, this.y - this.displayHeight / 2 - 10, text, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color,
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: t,
      y: t.y - 34,
      alpha: 0,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => t.destroy(),
    });
  }
}
