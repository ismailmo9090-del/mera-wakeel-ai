const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size, pixelFn) {
  // RGBA raw scanlines with filter byte 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const BG = [15, 23, 42];      // #0F172A
const AMBER = [217, 136, 0];   // #D98800
const WHITE = [255, 255, 255];

// Gavel triangle in the top half (scaled by `s` = number of `unit` px).
// Then a white circle with amber "MW" drawn as blocky pixels in the lower half.
function drawIcon(size, maskable) {
  const unit = size / 32;
  const cx = size / 2;

  // Rounded-ish corner masking when not maskable: leave full corner for maskable
  const corner = (x, y) => {
    if (!maskable) return true;
    return true; // maskable keeps full bleed
  };

  return makePng(size, (x, y) => {
    // Background
    let col = BG, a = 255;
    // Corner rounding (non-maskable)
    if (!maskable) {
      const r = size * 0.12;
      const cxC = Math.min(x, size - x);
      const cyC = Math.min(y, size - y);
    }

    const gavelTop = size * 0.18;
    const gavelBottom = size * 0.46;
    const poleHalf = unit * 1.1;

    // Gavel (trapezoid: wider base triangle + a vertical center)
    // Triangle: apex at (cx, gavelTop), base at gavelBottom spanning cx±(size*0.3)
    if (y >= gavelTop && y <= gavelBottom) {
      const t = (y - gavelTop) / (gavelBottom - gavelTop);
      const half = size * 0.3 * (1 - t) + poleHalf * t;
      if (Math.abs(x - cx) <= half) { col = AMBER; a = 255; return [col[0], col[1], col[2], a]; }
    }

    // Center pole
    if (x >= cx - poleHalf && x <= cx + poleHalf && y >= gavelBottom && y <= gavelBottom + unit * 4) {
      col = AMBER; a = 255; return [col[0], col[1], col[2], a];
    }

    // White circle behind "MW"
    const circleCy = size * 0.7;
    const circleR = size * (maskable ? 0.2 : 0.16);
    const dx = x - cx, dy = y - circleCy;
    if (dx * dx + dy * dy <= circleR * circleR) col = WHITE;

    // "MW" block letters in amber on the white circle
    const fs = size * 0.048; // stroke thickness
    const lh = size * 0.09;
    const ly = circleCy - lh / 2;
    const m1x = cx - size * 0.085;
    const m2x = cx + size * 0.045;
    const m3x = cx + size * 0.10;

    function inChar(px, py) {
      if (py < ly || py > ly + lh) return false;
      const v = ly + lh; // baseline
      // M1: left vertical + center
      const midY = (py - ly) / lh; // 0..1
      const halfM = size * 0.055 * (1 - midY) * 2.2 + fs;
      if (Math.abs(px - m1x) <= fs / 2 && py >= ly) return true;
      if (px >= m1x - halfM && px <= m1x + halfM && midY <= 0.55) return true;
      // M2 (second M's left)
      if (Math.abs(px - m2x) <= fs / 2) return true;
      // W: two legs + troughs -> approximate with two diagonals
      const legW = fs * 1.4;
      if (Math.abs(px - (m3x)) <= legW / 2) return true;
      return false;
    }

    if (col === WHITE && inChar(x, y)) { col = AMBER; a = 255; return [col[0], col[1], col[2], a]; }

    return [col[0], col[1], col[2], a];
  });
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'mw-192.png'), drawIcon(192, false));
fs.writeFileSync(path.join(outDir, 'mw-512.png'), drawIcon(512, false));
fs.writeFileSync(path.join(outDir, 'mw-maskable.png'), drawIcon(512, true));
console.log('Generated PNG icons in', outDir);