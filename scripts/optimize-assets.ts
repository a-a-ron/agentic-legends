/**
 * Asset optimization pipeline.
 *
 * Reads the whitelisted PNGs in `assets-src/raw/`, downscales each to a
 * web-friendly WebP under `src/assets/generated/`, and additionally produces a
 * "portrait" version for character images where the title text band at the
 * top ~22% of the source has been cropped away.
 *
 * Specs flagged `passthrough: true` are copied verbatim as PNG (no resize, no
 * re-encode). Use this for pixel-art sprite sheets where lossy WebP would
 * blur hard pixel edges.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SRC_DIR = path.join(ROOT, "assets-src", "raw");
const OUT_DIR = path.join(ROOT, "src", "assets", "generated");

const FULL_WIDTH = 1280;
const PORTRAIT_WIDTH = 512;
const PORTRAIT_TOP_CROP = 0.22;

interface AssetSpec {
  file: string;
  slug: string;
  /** When true, also emit a `${slug}-portrait.webp` with the top text band cropped. */
  portrait: boolean;
  /**
   * When true, copy the source PNG verbatim to the output directory as
   * `${slug}.png` instead of re-encoding to WebP. Use for pixel-art sprite
   * sheets where lossy compression would destroy hard pixel edges.
   */
  passthrough?: boolean;
  /**
   * When set, treat the source as an icon with a near-white background.
   * The pipeline reads raw RGBA, sets any pixel whose channel sum is
   * >= the threshold (out of 765) to alpha=0, resizes to the requested
   * square, and writes `${slug}.png`. Used to turn the Copilot avatar
   * JPG into a clean transparent orb sprite.
   */
  alphaKey?: { threshold: number; size: number };
  /**
   * When set, resize to exact dimensions using fit: 'cover' anchored at
   * the specified position (default 'top').
   */
  cover?: { width: number; height: number; position?: string };
}

const ASSETS: AssetSpec[] = [
  { file: "title-art.png", slug: "title-art", portrait: false, cover: { width: 1280, height: 720, position: "top" } },
  { file: "forest-archive-bg.png", slug: "forest-archive-bg", portrait: false, cover: { width: 1280, height: 720, position: "center" } },
  { file: "enchanted-forest.png", slug: "enchanted-forest", portrait: false, cover: { width: 1280, height: 720, position: "center" } },
  { file: "cloud-background.png", slug: "cloud-background", portrait: false, cover: { width: 1280, height: 720, position: "center" } },
  { file: "final.png", slug: "final-background", portrait: false, cover: { width: 1280, height: 720, position: "center" } },
  { file: "mainline.png", slug: "victory-background", portrait: false, cover: { width: 1280, height: 720, position: "center" } },
  { file: "forest-archive-rat.png", slug: "forest-archive-rat", portrait: false, passthrough: true },
  { file: "frog-bug.png", slug: "frog-bug", portrait: false, passthrough: true },
  { file: "bird.png", slug: "bird", portrait: false, passthrough: true },
  { file: "bat.png", slug: "bat", portrait: false, passthrough: true },
  { file: "start-mol.png", slug: "start-mol", portrait: false },
  { file: "mona-intro.png", slug: "mona-intro", portrait: false, passthrough: true },
  { file: "ducky.png", slug: "ducky", portrait: false, passthrough: true },
  { file: "ducky-intro.png", slug: "ducky-intro", portrait: true },
  { file: "copilot2.png", slug: "copilot2", portrait: false, passthrough: true },
  { file: "copilot-intro.png", slug: "copilot-intro", portrait: true },
  { file: "adventurer-bubbles-of-clarity.png", slug: "adventurer-bubbles", portrait: true },
  { file: "adventurer-fork-of-curiosity.png", slug: "adventurer-fork", portrait: true },
  { file: "adventurer-goggles-of-insight.png", slug: "adventurer-goggles", portrait: true },
  { file: "bubbles-of-clarity-reward.png", slug: "bubbles-reward", portrait: false },
  { file: "fork-of-curiosity-reward.png", slug: "fork-reward", portrait: false },
  { file: "goggles-of-insight-reward.png", slug: "goggles-reward", portrait: false },
  { file: "next-challenge-hero.png", slug: "next-challenge-hero", portrait: false },
  { file: "next-challenge-item.png", slug: "next-challenge-item", portrait: false },
  { file: "adventurer-mage-sheet.png", slug: "adventurer-walk", portrait: false, passthrough: true },
  { file: "adventurer-idle-sheet.png", slug: "adventurer-idle", portrait: false, passthrough: true },
  { file: "adventurer-jump-sheet.png", slug: "adventurer-jump", portrait: false, passthrough: true },
  // Copilot avatar → final-stand goal orb. Strip the white background.
  { file: "github-copilot.jpg", slug: "copilot-orb", portrait: false, alphaKey: { threshold: 720, size: 512 } },
  // QR code shown on Victory screen — passthrough preserves crispness for scanning.
  { file: "al-qrcode.png", slug: "qr-code", portrait: false, passthrough: true },
];

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function processOne(spec: AssetSpec) {
  const srcPath = path.join(SRC_DIR, spec.file);
  const srcStat = await fs.stat(srcPath);
  const kb = (n: number) => `${(n / 1024).toFixed(0)}KB`;

  if (spec.passthrough) {
    const outPng = path.join(OUT_DIR, `${spec.slug}.png`);
    await Promise.all([
      fs.rm(path.join(OUT_DIR, `${spec.slug}.webp`), { force: true }),
      fs.rm(path.join(OUT_DIR, `${spec.slug}-portrait.webp`), { force: true }),
    ]);
    await fs.copyFile(srcPath, outPng);
    const outStat = await fs.stat(outPng);
    console.log(
      `${spec.slug.padEnd(24)} ${kb(srcStat.size).padStart(7)} -> ${kb(outStat.size).padStart(7)} (passthrough PNG)`,
    );
    return;
  }

  if (spec.alphaKey) {
    const { threshold, size } = spec.alphaKey;
    const outPng = path.join(OUT_DIR, `${spec.slug}.png`);
    // Resize first, then walk the raw RGBA buffer and clear any pixel
    // whose channel sum >= threshold (white background → transparent).
    const { data, info } = await sharp(srcPath)
      .resize({ width: size, height: size, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const sum = data[i] + data[i + 1] + data[i + 2];
      if (sum >= threshold) {
        data[i + 3] = 0;
      }
    }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toFile(outPng);
    const outStat = await fs.stat(outPng);
    console.log(
      `${spec.slug.padEnd(24)} ${kb(srcStat.size).padStart(7)} -> ${kb(outStat.size).padStart(7)} (alpha-keyed PNG)`,
    );
    return;
  }

  const outFull = path.join(OUT_DIR, `${spec.slug}.webp`);
  const outPortrait = path.join(OUT_DIR, `${spec.slug}-portrait.webp`);

  const meta = await sharp(srcPath).metadata();
  const srcW = meta.width ?? FULL_WIDTH;
  const srcH = meta.height ?? FULL_WIDTH;

  if (spec.cover) {
    await sharp(srcPath)
      .resize(spec.cover.width, spec.cover.height, { fit: "cover", position: spec.cover.position ?? "top" })
      .webp({ quality: 82, effort: 5 })
      .toFile(outFull);
  } else {
    await sharp(srcPath)
      .resize({ width: Math.min(FULL_WIDTH, srcW), withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(outFull);
  }
  const fullStat = await fs.stat(outFull);

  let portraitStatSize: number | null = null;
  if (spec.portrait) {
    const cropTop = Math.floor(srcH * PORTRAIT_TOP_CROP);
    const cropHeight = srcH - cropTop;
    await sharp(srcPath)
      .extract({ left: 0, top: cropTop, width: srcW, height: cropHeight })
      .resize({ width: Math.min(PORTRAIT_WIDTH, srcW), withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toFile(outPortrait);
    portraitStatSize = (await fs.stat(outPortrait)).size;
  }

  const portraitMsg = portraitStatSize !== null ? `, portrait ${kb(portraitStatSize)}` : "";
  console.log(
    `${spec.slug.padEnd(24)} ${kb(srcStat.size).padStart(7)} -> ${kb(fullStat.size).padStart(7)}${portraitMsg}`,
  );
}

async function main() {
  await ensureDir(OUT_DIR);
  console.log(`Optimizing ${ASSETS.length} assets...\n`);
  for (const spec of ASSETS) {
    await processOne(spec);
  }

  // Compute total transferred size
  const files = await fs.readdir(OUT_DIR);
  let total = 0;
  for (const f of files) {
    const s = await fs.stat(path.join(OUT_DIR, f));
    total += s.size;
  }
  console.log(`\nTotal generated: ${(total / 1024 / 1024).toFixed(2)} MB across ${files.length} files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
