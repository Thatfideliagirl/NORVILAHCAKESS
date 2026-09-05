// The client's logo PDF has the artwork flattened onto a solid black
// page (no alpha channel survived export), so any originally-dark
// linework (the cupcake icing swirl) is indistinguishable from the
// background and is lost. This keys pure black out to transparency,
// trims to content, and produces a palette-tinted icon mark alongside
// the original-color lockup, since the source orange doesn't sit well
// against the site's dusty-pink editorial palette.
import sharp from "sharp";

const BERRY = { r: 142, g: 47, b: 68 };
const COCOA = { r: 58, g: 36, b: 31 };

async function keyOutBlackAndTrim(input, output) {
  const img = sharp(input);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    const alpha = Math.max(r, g, b);
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = alpha;
  }
  await sharp(out, { raw: { width, height, channels: 4 } })
    .trim()
    .png()
    .toFile(output);
}

async function tint(input, output, color) {
  const img = sharp(input);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const a = data[i * channels + 3];
    out[i * 4] = color.r;
    out[i * 4 + 1] = color.g;
    out[i * 4 + 2] = color.b;
    out[i * 4 + 3] = a;
  }
  await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(output);
}

await keyOutBlackAndTrim("/tmp/pdf-extract/logo-000.jpg", "/tmp/pdf-extract/lockup-orange.png");
await keyOutBlackAndTrim("/tmp/pdf-extract/logo-001.jpg", "/tmp/pdf-extract/icon-orange.png");

await tint("/tmp/pdf-extract/icon-orange.png", "/tmp/pdf-extract/icon-berry.png", BERRY);
await tint("/tmp/pdf-extract/icon-orange.png", "/tmp/pdf-extract/icon-cocoa.png", COCOA);
await tint("/tmp/pdf-extract/lockup-orange.png", "/tmp/pdf-extract/lockup-cocoa.png", COCOA);

console.log("done");
