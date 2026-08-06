const sharp = require("sharp");
const path = require("path");

const src = "C:/Users/Blvckdot/Downloads/Logos";
const out = "public/logos";

const files = [
  ["panora-dark", "Panora Dark.png"],
  ["panora-light", "Panora Light.png"],
  ["pgo-dark", "PGO Dark.png"],
  ["pgo-light", "PGO Light.png"],
];

async function go() {
  for (const [name, file] of files) {
    const input = path.join(src, file);
    const buf = await sharp(input)
      .trim({ threshold: 10 })
      .resize({ width: 960, withoutEnlargement: true })
      .png({ compressionLevel: 8, quality: 92 })
      .toBuffer();
    await sharp(buf).toFile(path.join(out, `${name}.web.png`));
    await sharp(buf)
      .resize(256, 256, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile(path.join(out, `${name}-icon.png`));
    const meta = await sharp(buf).metadata();
    console.log(name, "ok", meta.width, "x", meta.height);
  }
}

go().catch((e) => {
  console.error(e);
  process.exit(1);
});
