// Generates the placeholder category photography we don't have yet.
// Every one of these is an on-brand illustrated stand-in (same palette
// and light direction as the hero video), never a fake photo, so it's
// obvious to the client which images to swap for real photography.
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
const STROKE_BERRY = `stroke="${COLORS.berry}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

const icons = {
  cupcakes: `
    <path d="M -110 40 L -85 170 Q 0 195 85 170 L 110 40 Z" fill="${COLORS.wood}" opacity="0.9" />
    <path d="M -110 40 L -85 170 Q 0 195 85 170 L 110 40" ${STROKE} />
    ${Array.from({ length: 7 }, (_, i) => -90 + i * 30)
      .map((x) => `<line x1="${x}" y1="45" x2="${x - 6}" y2="165" stroke="${COLORS.ink}" stroke-width="3" opacity="0.35" />`)
      .join("")}
    <path d="M -100 40 Q -60 -70 0 -30 Q 40 -80 90 40 Q 30 10 0 40 Q -40 10 -100 40 Z" fill="${COLORS.plaster}" />
    <path d="M -100 40 Q -60 -70 0 -30 Q 40 -80 90 40" ${STROKE} />
    <circle cx="4" cy="-70" r="14" fill="${COLORS.berry}" />
  `,
  parfaits: `
    <path d="M -95 -160 L -55 190 Q 0 215 55 190 L 95 -160 Z" ${STROKE} />
    <path d="M -80 -20 Q 0 5 80 -20 L 65 100 Q 0 122 -65 100 Z" fill="${COLORS.wood}" opacity="0.85" />
    <path d="M -88 -85 Q 0 -60 88 -85" ${STROKE_BERRY} />
    <path d="M -80 -20 Q 0 5 80 -20" ${STROKE} />
    <circle cx="-30" cy="-140" r="15" fill="${COLORS.berry}" />
    <circle cx="20" cy="-155" r="12" fill="${COLORS.berry}" />
    <circle cx="55" cy="-135" r="10" fill="${COLORS.ink}" opacity="0.7" />
    <path d="M 120 -150 L 150 40 Q 150 60 130 60 Q 110 60 110 40 L 118 -150 Z" ${STROKE} />
  `,
  waffles: `
    <rect x="-140" y="-140" width="280" height="280" rx="26" fill="${COLORS.wood}" opacity="0.9" />
    <rect x="-140" y="-140" width="280" height="280" rx="26" ${STROKE} />
    ${[-93, -47, 0, 47, 93]
      .map((p) => `<line x1="${p}" y1="-140" x2="${p}" y2="140" stroke="${COLORS.ink}" stroke-width="5" opacity="0.55" />`)
      .join("")}
    ${[-93, -47, 0, 47, 93]
      .map((p) => `<line x1="-140" y1="${p}" x2="140" y2="${p}" stroke="${COLORS.ink}" stroke-width="5" opacity="0.55" />`)
      .join("")}
    <path d="M -150 -175 Q -100 -195 -60 -175 Q -20 -155 20 -175 Q 60 -195 100 -175" ${STROKE_BERRY} />
    <circle cx="-70" cy="-195" r="8" fill="${COLORS.berry}" />
    <circle cx="10" cy="-200" r="8" fill="${COLORS.berry}" />
  `,
  "banana-bread": `
    <path d="M -160 60 Q -160 -70 0 -75 Q 160 -70 160 60 L 160 90 L -160 90 Z" fill="${COLORS.wood}" />
    <path d="M -160 60 Q -160 -70 0 -75 Q 160 -70 160 60" ${STROKE} />
    <line x1="-160" y1="90" x2="160" y2="90" stroke="${COLORS.ink}" stroke-width="9" stroke-linecap="round" />
    <path d="M 40 -68 Q 60 10 40 88" ${STROKE} />
    <path d="M 95 -55 Q 112 10 96 88" ${STROKE} />
    ${[-90, -50, 0, 60, 110, -20, 20].map(
      (x, i) => `<circle cx="${x}" cy="${-20 + (i % 3) * 30}" r="7" fill="${COLORS.cocoa}" />`
    ).join("")}
  `,
  "milky-yoghurt": `
    <path d="M -80 -140 L -100 130 Q -100 175 0 175 Q 100 175 100 130 L 80 -140 Z" ${STROKE} />
    <ellipse cx="0" cy="-140" rx="80" ry="22" fill="${COLORS.plaster}" />
    <ellipse cx="0" cy="-140" rx="80" ry="22" ${STROKE} />
    <path d="M -92 -30 Q 0 -5 92 -30" ${STROKE_BERRY} />
    <circle cx="-30" cy="-70" r="7" fill="${COLORS.wood}" />
    <circle cx="10" cy="-80" r="7" fill="${COLORS.wood}" />
    <circle cx="45" cy="-65" r="7" fill="${COLORS.wood}" />
    <path d="M 130 -190 L 150 30 Q 150 50 130 50 Q 110 50 110 30 L 122 -190 Z" ${STROKE} />
  `,
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
