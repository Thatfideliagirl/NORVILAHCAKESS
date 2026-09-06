// Generates the placeholder category photography we don't have yet.
// Every one of these is an on-brand illustrated stand-in (same palette
// and light direction as the hero video), never a fake photo, so it's
// obvious to the client which images to swap for real photography.
//
// IMPORTANT: only list slugs here that are STILL placeholders. Cakes,
// cupcakes, parfaits, waffles, meat-pies, banana-bread and milky-yoghurt
// now have real client photography in public/products/ -- re-running
// this script for those slugs would silently overwrite the real
// photos with illustrations again (it happened once already).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const COLORS = {
  plaster: "#E2BFB5",
  rose: "#D1A89C",
  clay: "#8E685E",
  cream: "#F6EBE3",
  cocoa: "#3A241F",
  berry: "#8E2F44",
  wood: "#CB9D79",
  ink: "#4A322C",
};

function frame(icon) {
  return `<svg width="900" height="1200" viewBox="0 0 900 1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.cream}" />
      <stop offset="55%" stop-color="${COLORS.plaster}" />
      <stop offset="100%" stop-color="${COLORS.rose}" />
    </linearGradient>
    <radialGradient id="light" cx="18%" cy="14%" r="60%">
      <stop offset="0%" stop-color="${COLORS.cream}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${COLORS.cream}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="ground" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${COLORS.cocoa}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="${COLORS.cocoa}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)" />
  <rect width="900" height="1200" fill="url(#light)" />
  <ellipse cx="450" cy="860" rx="300" ry="70" fill="url(#ground)" />
  <g transform="translate(450 610) scale(1.85)">${icon}</g>
</svg>`;
}

const STROKE = `stroke="${COLORS.ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

const icons = {
  "greek-yoghurt": `
    <path d="M -80 -140 L -100 130 Q -100 175 0 175 Q 100 175 100 130 L 80 -140 Z" ${STROKE} />
    <ellipse cx="0" cy="-140" rx="80" ry="22" fill="${COLORS.plaster}" />
    <ellipse cx="0" cy="-140" rx="80" ry="22" ${STROKE} />
    <path d="M -85 -55 Q -55 -35 -30 -60 Q -5 -80 20 -55 Q 45 -30 80 -60" stroke="${COLORS.wood}" stroke-width="9" stroke-linecap="round" fill="none" />
    <path d="M 130 -190 Q 155 -170 150 -140 Q 148 -110 130 -100" ${STROKE} />
  `,
  "small-chops": `
    <ellipse cx="0" cy="120" rx="170" ry="30" fill="${COLORS.wood}" opacity="0.5" />
    <ellipse cx="-70" cy="60" rx="55" ry="38" fill="${COLORS.wood}" />
    <ellipse cx="-70" cy="60" rx="55" ry="38" ${STROKE} />
    <path d="M 20 20 L 100 20 L 130 60 L 100 100 L 20 100 Z" fill="${COLORS.wood}" />
    <path d="M 20 20 L 100 20 L 130 60 L 100 100 L 20 100 Z" ${STROKE} />
    <line x1="-140" y1="-10" x2="-100" y2="60" stroke="${COLORS.ink}" stroke-width="6" stroke-linecap="round" />
    <circle cx="-145" cy="-20" r="8" fill="${COLORS.berry}" />
  `,
  "coconut-bread": `
    <path d="M -160 60 Q -160 -70 0 -75 Q 160 -70 160 60 L 160 90 L -160 90 Z" fill="${COLORS.wood}" />
    <path d="M -160 60 Q -160 -70 0 -75 Q 160 -70 160 60" ${STROKE} />
    <line x1="-160" y1="90" x2="160" y2="90" stroke="${COLORS.ink}" stroke-width="9" stroke-linecap="round" />
    <path d="M 40 -68 Q 60 10 40 88" ${STROKE} />
    <path d="M 95 -55 Q 112 10 96 88" ${STROKE} />
    ${[-90, -50, 0, 60, 110, -20, 20].map(
      (x, i) => `<circle cx="${x}" cy="${-20 + (i % 3) * 30}" r="6" fill="${COLORS.cream}" />`
    ).join("")}
    <circle cx="-150" cy="-130" r="46" fill="${COLORS.plaster}" />
    <path d="M -150 -130 A 46 46 0 0 1 -104 -130" ${STROKE} />
    <path d="M -184 -130 Q -150 -150 -116 -130" stroke="${COLORS.ink}" stroke-width="3" opacity="0.4" fill="none" />
    <path d="M -172 -118 Q -150 -134 -128 -118" stroke="${COLORS.ink}" stroke-width="3" opacity="0.4" fill="none" />
  `,
  granola: `
    <path d="M -140 -20 Q -140 100 0 100 Q 140 100 140 -20 Z" fill="${COLORS.wood}" opacity="0.85" />
    <path d="M -140 -20 Q -140 100 0 100 Q 140 100 140 -20" ${STROKE} />
    <line x1="-140" y1="-20" x2="140" y2="-20" ${STROKE} />
    ${[-90, -50, -10, 30, 70, 100, -70, 10, 60].map(
      (x, i) => `<circle cx="${x}" cy="${20 + (i % 3) * 20}" r="9" fill="${COLORS.cocoa}" opacity="0.7" />`
    ).join("")}
    <path d="M 100 -110 L 120 -20 Q 120 0 100 0 Q 80 0 80 -20 L 92 -110 Z" ${STROKE} />
  `,
};

await mkdir("public/products", { recursive: true });

for (const [slug, icon] of Object.entries(icons)) {
  const svg = Buffer.from(frame(icon));
  await sharp(svg)
    .jpeg({ quality: 86 })
    .toFile(`public/products/${slug}.jpg`);
  console.log("placeholder written:", slug);
}
