// Section 3 needs one full-bleed image: an empty, lit plaster wall on
// the left third (where the heading and paragraph sit) and the piping
// moment on the right two thirds. Illustrated placeholder, same rules
// as make-placeholders.mjs, pending real photography of the piped cake.
import sharp from "sharp";

const C = {
  plaster: "#E2BFB5",
  rose: "#D1A89C",
  clay: "#8E685E",
  cream: "#F6EBE3",
  cocoa: "#3A241F",
  berry: "#8E2F44",
  wood: "#CB9D79",
  ink: "#4A322C",
};

const W = 1600;
const H = 900;
const STROKE = `stroke="${C.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
const STROKE_BERRY = `stroke="${C.berry}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wall" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${C.cream}" />
      <stop offset="100%" stop-color="${C.plaster}" />
    </linearGradient>
    <linearGradient id="room" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${C.plaster}" />
      <stop offset="60%" stop-color="${C.rose}" />
      <stop offset="100%" stop-color="${C.clay}" />
    </linearGradient>
    <radialGradient id="glow" cx="20%" cy="10%" r="70%">
      <stop offset="0%" stop-color="${C.cream}" stop-opacity="0.65" />
      <stop offset="100%" stop-color="${C.cream}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="ray" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${C.cream}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${C.cream}" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="ground" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${C.cocoa}" stop-opacity="0.2" />
      <stop offset="100%" stop-color="${C.cocoa}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#room)" />
  <rect width="${W / 3}" height="${H}" fill="url(#wall)" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />

  <g opacity="0.8">
    <polygon points="-50,0 120,0 20,900 -180,900" fill="url(#ray)" />
    <polygon points="220,0 300,0 260,900 150,900" fill="url(#ray)" />
  </g>

  <ellipse cx="1080" cy="760" rx="280" ry="60" fill="url(#ground)" />

  <g transform="translate(1080 560) scale(2.6)">
    <!-- piping bag -->
    <path d="M -20 -170 L 40 -170 L 55 -40 Q 55 -10 15 -5 L -15 -5 Q -55 -10 -55 -40 Z" fill="${C.wood}" opacity="0.9" />
    <path d="M -20 -170 L 40 -170 L 55 -40 Q 55 -10 15 -5 L -15 -5 Q -55 -10 -55 -40 Z" ${STROKE} />
    <line x1="-30" y1="-140" x2="45" y2="-140" stroke="${C.ink}" stroke-width="4" opacity="0.4" />
    <line x1="-35" y1="-100" x2="50" y2="-100" stroke="${C.ink}" stroke-width="4" opacity="0.4" />
    <path d="M -15 -5 L -8 25 L 8 25 L 15 -5 Z" ${STROKE} />

    <!-- hand -->
    <path d="M -75 -55 Q -110 -35 -95 15 Q -85 45 -40 40 L 10 20 Q 15 5 -5 -5 L -55 -35 Q -70 -60 -75 -55 Z" fill="${C.plaster}" />
    <path d="M -75 -55 Q -110 -35 -95 15 Q -85 45 -40 40 L 10 20 Q 15 5 -5 -5 L -55 -35 Q -70 -60 -75 -55 Z" ${STROKE} />

    <!-- cupcake being piped -->
    <path d="M -70 60 L -55 165 Q 0 185 55 165 L 70 60 Z" fill="${C.clay}" opacity="0.9" />
    <path d="M -70 60 L -55 165 Q 0 185 55 165 L 70 60" ${STROKE} />
    <path d="M -65 60 Q -35 5 0 35 Q 30 5 65 60 Q 25 35 0 60 Q -25 35 -65 60 Z" fill="${C.plaster}" />
    <path d="M -65 60 Q -35 5 0 35 Q 30 5 65 60" ${STROKE_BERRY} />
  </g>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile("public/brand-section.jpg");
console.log("brand-section.jpg written");
