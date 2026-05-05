const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const outDir = path.join(__dirname, '..', 'assets', 'mila');
fs.mkdirSync(outDir, { recursive: true });

const W = 512;
const H = 512;

function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace('#', '');
  const value = parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
    a: Math.round(alpha * 255),
  };
}

function blend(px, color) {
  const a = color.a / 255;
  px[0] = Math.round(color.r * a + px[0] * (1 - a));
  px[1] = Math.round(color.g * a + px[1] * (1 - a));
  px[2] = Math.round(color.b * a + px[2] * (1 - a));
  px[3] = Math.min(255, Math.round(color.a + px[3] * (1 - a)));
}

function makeCanvas() {
  const png = new PNG({ width: W, height: H });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 0;
  }
  return png;
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const idx = (Math.floor(y) * W + Math.floor(x)) * 4;
  const px = [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
  blend(px, color);
  png.data[idx] = px[0];
  png.data[idx + 1] = px[1];
  png.data[idx + 2] = px[2];
  png.data[idx + 3] = px[3];
}

function ellipse(png, cx, cy, rx, ry, fill) {
  const color = hexToRgba(fill.hex, fill.alpha ?? 1);
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPixel(png, x, y, color);
    }
  }
}

function rect(png, x, y, w, h, fill) {
  const color = hexToRgba(fill.hex, fill.alpha ?? 1);
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(png, xx, yy, color);
  }
}

function roundedRect(png, x, y, w, h, r, fill) {
  rect(png, x + r, y, w - r * 2, h, fill);
  rect(png, x, y + r, w, h - r * 2, fill);
  ellipse(png, x + r, y + r, r, r, fill);
  ellipse(png, x + w - r, y + r, r, r, fill);
  ellipse(png, x + r, y + h - r, r, r, fill);
  ellipse(png, x + w - r, y + h - r, r, r, fill);
}

function line(png, x1, y1, x2, y2, width, fill) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    ellipse(png, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, width / 2, fill);
  }
}

function arc(png, cx, cy, rx, ry, start, end, width, fill) {
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const t = start + (end - start) * (i / steps);
    ellipse(png, cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, width / 2, width / 2, fill);
  }
}

function triangle(png, ax, ay, bx, by, cx, cy, fill) {
  const color = hexToRgba(fill.hex, fill.alpha ?? 1);
  const minX = Math.floor(Math.min(ax, bx, cx));
  const maxX = Math.ceil(Math.max(ax, bx, cx));
  const minY = Math.floor(Math.min(ay, by, cy));
  const maxY = Math.ceil(Math.max(ay, by, cy));
  const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const w1 = ((bx - x) * (cy - y) - (by - y) * (cx - x)) / area;
      const w2 = ((cx - x) * (ay - y) - (cy - y) * (ax - x)) / area;
      const w3 = 1 - w1 - w2;
      if (w1 >= 0 && w2 >= 0 && w3 >= 0) setPixel(png, x, y, color);
    }
  }
}

function drawMila(state) {
  const png = makeCanvas();
  const green = '#9fcfa4';
  const darkGreen = '#1d654b';
  const face = '#fff2cf';
  const ink = '#14221d';
  const scarfRed = '#e9563e';
  const scarfGold = '#f3b542';

  ellipse(png, 256, 442, 124, 22, { hex: '#17201c', alpha: 0.12 });
  ellipse(png, 184, 342, 62, 92, { hex: green });
  ellipse(png, 328, 342, 62, 92, { hex: green });
  ellipse(png, 256, 270, 154, 164, { hex: green });
  ellipse(png, 256, 246, 124, 118, { hex: face });
  triangle(png, 128, 160, 162, 42, 218, 156, { hex: '#86bd8b' });
  triangle(png, 384, 160, 350, 42, 294, 156, { hex: '#86bd8b' });
  ellipse(png, 222, 90, 88, 36, { hex: darkGreen });
  ellipse(png, 238, 82, 88, 34, { hex: darkGreen });

  if (state === 'reviewing') {
    roundedRect(png, 162, 292, 188, 126, 18, { hex: '#26724f' });
    roundedRect(png, 176, 306, 160, 98, 12, { hex: '#f4f1dc' });
    line(png, 200, 334, 310, 334, 8, { hex: '#7ea67c' });
    line(png, 200, 362, 296, 362, 8, { hex: '#7ea67c' });
  } else {
    roundedRect(png, 126, 300, 260, 48, 24, { hex: scarfRed });
    rect(png, 256, 300, 130, 48, { hex: scarfGold });
    rect(png, 226, 300, 60, 90, { hex: ink });
  }

  ellipse(png, 210, 230, 30, 36, { hex: '#102f27' });
  ellipse(png, 302, 230, 30, 36, { hex: '#102f27' });
  ellipse(png, 200, 218, 10, 12, { hex: '#ffffff' });
  ellipse(png, 292, 218, 10, 12, { hex: '#ffffff' });
  ellipse(png, 184, 272, 18, 14, { hex: '#ef9b7b', alpha: 0.45 });
  ellipse(png, 328, 272, 18, 14, { hex: '#ef9b7b', alpha: 0.45 });
  triangle(png, 236, 258, 276, 258, 256, 284, { hex: '#e79b24' });

  if (state === 'listening') {
    ellipse(png, 256, 294, 12, 18, { hex: '#8a3922' });
    arc(png, 390, 208, 34, 56, -0.7, 0.7, 8, { hex: darkGreen, alpha: 0.7 });
    arc(png, 420, 208, 52, 82, -0.7, 0.7, 7, { hex: darkGreen, alpha: 0.45 });
  } else if (state === 'correcting') {
    arc(png, 256, 288, 40, 24, Math.PI * 1.1, Math.PI * 1.9, 8, { hex: '#8a3922' });
    ellipse(png, 342, 118, 40, 40, { hex: '#fff7db' });
    line(png, 342, 96, 342, 124, 9, { hex: '#ef705d' });
    ellipse(png, 342, 142, 6, 6, { hex: '#ef705d' });
  } else if (state === 'celebrating') {
    arc(png, 256, 284, 46, 30, 0.1, Math.PI - 0.1, 10, { hex: '#8a3922' });
    line(png, 122, 280, 74, 220, 22, { hex: green });
    line(png, 390, 280, 438, 220, 22, { hex: green });
    ellipse(png, 106, 194, 9, 9, { hex: scarfGold });
    ellipse(png, 418, 180, 9, 9, { hex: '#ef705d' });
    ellipse(png, 394, 112, 8, 8, { hex: '#74aa77' });
  } else if (state === 'encouraging') {
    arc(png, 256, 284, 42, 26, 0.1, Math.PI - 0.1, 10, { hex: '#8a3922' });
    line(png, 374, 280, 422, 238, 22, { hex: green });
    ellipse(png, 392, 148, 40, 36, { hex: '#fff7db' });
    triangle(png, 376, 176, 350, 194, 366, 164, { hex: '#fff7db' });
    ellipse(png, 392, 148, 16, 14, { hex: '#ef705d' });
  } else {
    arc(png, 256, 286, 38, 22, 0.1, Math.PI - 0.1, 8, { hex: '#8a3922' });
  }

  return png;
}

function drawLena() {
  const png = makeCanvas();
  ellipse(png, 256, 442, 118, 20, { hex: '#17201c', alpha: 0.11 });
  ellipse(png, 256, 214, 100, 116, { hex: '#2b1c19' });
  ellipse(png, 256, 226, 82, 92, { hex: '#ffd9bc' });
  ellipse(png, 206, 214, 30, 82, { hex: '#2b1c19' });
  ellipse(png, 306, 214, 30, 82, { hex: '#2b1c19' });
  ellipse(png, 228, 226, 12, 15, { hex: '#151815' });
  ellipse(png, 284, 226, 12, 15, { hex: '#151815' });
  ellipse(png, 224, 220, 5, 5, { hex: '#ffffff' });
  ellipse(png, 280, 220, 5, 5, { hex: '#ffffff' });
  arc(png, 256, 260, 30, 18, 0.15, Math.PI - 0.15, 6, { hex: '#8a3922' });
  ellipse(png, 206, 252, 15, 12, { hex: '#ef9b7b', alpha: 0.5 });
  ellipse(png, 306, 252, 15, 12, { hex: '#ef9b7b', alpha: 0.5 });
  roundedRect(png, 164, 320, 184, 116, 40, { hex: '#18a873' });
  triangle(png, 214, 320, 298, 320, 256, 374, { hex: '#fff7e8' });
  roundedRect(png, 282, 342, 46, 24, 10, { hex: '#fff2d7' });
  line(png, 186, 382, 130, 426, 22, { hex: '#18a873' });
  line(png, 326, 382, 382, 426, 22, { hex: '#18a873' });
  roundedRect(png, 358, 392, 80, 52, 14, { hex: '#fffdf8' });
  line(png, 374, 412, 422, 412, 6, { hex: '#d7c39c' });
  line(png, 374, 430, 414, 430, 6, { hex: '#d7c39c' });
  return png;
}

function writePng(name, png) {
  fs.writeFileSync(path.join(outDir, name), PNG.sync.write(png));
}

for (const state of ['idle', 'listening', 'encouraging', 'correcting', 'celebrating', 'reviewing']) {
  writePng(`mila-${state}.png`, drawMila(state));
}
writePng('lena-store-assistant.png', drawLena());

