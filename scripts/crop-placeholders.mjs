import sharp from "sharp";

const SRC = "/tmp/poster_hq.jpg";

// Per the brief, only cakes and meat pies are temporary crops taken
// straight from the hero video frame (the other five categories need
// dedicated photography and get an illustrated placeholder instead).
const crops = {
  cakes: { left: 650, top: 140, width: 330, height: 440 },
  "meat-pies": { left: 840, top: 420, width: 220, height: 293 },
};

for (const [name, box] of Object.entries(crops)) {
  await sharp(SRC)
    .extract(box)
    .resize(900, 1200, { fit: "cover" })
    .modulate({ saturation: 1.03 })
    .jpeg({ quality: 82 })
    .toFile(`/tmp/crop-${name}.jpg`);
  console.log("done", name);
}
