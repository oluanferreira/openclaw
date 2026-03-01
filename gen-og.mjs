import sharp from "sharp";

// Get logo dimensions
const logoMeta = await sharp("/tmp/clawin-logo.png").metadata();
console.log("Logo:", logoMeta.width, "x", logoMeta.height);

// Target: 1200x630, dark bg, logo centered
const W = 1200, H = 630;

// Resize logo to fit nicely (max ~800px wide, ~300px tall)
const maxLogoW = 800, maxLogoH = 300;
const scale = Math.min(maxLogoW / logoMeta.width, maxLogoH / logoMeta.height);
const resizedW = Math.round(logoMeta.width * scale);
const resizedH = Math.round(logoMeta.height * scale);

const logo = await sharp("/tmp/clawin-logo.png")
  .resize(resizedW, resizedH, { fit: "inside" })
  .toBuffer();

const left = Math.round((W - resizedW) / 2);
const top = Math.round((H - resizedH) / 2);

await sharp({
  create: {
    width: W,
    height: H,
    channels: 4,
    background: { r: 3, g: 7, b: 18, alpha: 1 }  // #030712
  }
})
  .composite([{ input: logo, left, top }])
  .png()
  .toFile("/root/openclaw/apps/web/src/app/opengraph-image.png");

console.log("OG image generated with real logo!");
