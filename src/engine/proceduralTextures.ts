import * as THREE from 'three';

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(maxAnisotropy, 8);
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

/**
 * Warm dark-brown glazed ceramic square wall tiles (faithful to reference screenshots)
 */
export function createKitchenTileTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1E1510';
  ctx.fillRect(0, 0, size, size);

  const cols = 4;
  const rows = 4;
  const tileW = size / cols;
  const tileH = size / rows;
  const grout = 4;

  const baseTones = ['#4A382B', '#443326', '#4E3C2F', '#413024', '#48372A'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileW + grout * 0.5;
      const y = r * tileH + grout * 0.5;
      const w = tileW - grout;
      const h = tileH - grout;

      const tone = baseTones[(r * 5 + c * 3) % baseTones.length];
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, tone);
      grad.addColorStop(0.55, '#3E2E23');
      grad.addColorStop(1, '#33251C');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(255, 224, 194, 0.08)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 5, 3);
}

/**
 * Dark speckled terrazzo / granite countertop texture
 */
export function createTerrazzoCounterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2B251F';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(12, 9, 7, 0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

  let seed = 4219;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const speckColors = ['#4B4237', '#6B5D4D', '#8C7A63', '#1D1814', '#584E42', '#A8947A'];
  for (let i = 0; i < 1600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.8 + rand() * 2.6;
    ctx.fillStyle = speckColors[Math.floor(rand() * speckColors.length)];
    ctx.globalAlpha = 0.25 + rand() * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return finalizeColorTexture(canvas, maxAnisotropy, 4, 2);
}

/**
 * Concentric tree-ring wooden chopping block top face
 */
export function createWoodBlockTopTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size * 0.5;
  const cy = size * 0.5;

  const baseGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, size * 0.5);
  baseGrad.addColorStop(0, '#B87846');
  baseGrad.addColorStop(0.55, '#9F6235');
  baseGrad.addColorStop(0.88, '#874F28');
  baseGrad.addColorStop(1, '#683A1B');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 1; i <= 36; i++) {
    const radius = i * 6.8;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.08) {
      const wobble =
        Math.sin(a * 3 + i * 0.35) * 3.8 +
        Math.cos(a * 5 - i * 0.2) * 2.1 +
        Math.sin(a * 2 + 1.1) * 4.5;
      const rr = radius + wobble;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(66, 33, 12, 0.36)' : 'rgba(92, 49, 20, 0.22)';
    ctx.lineWidth = i % 4 === 0 ? 2.1 : 1.1;
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(245, 212, 175, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 38; i++) {
    const y = cy - 85 + (i / 38) * 170;
    ctx.beginPath();
    ctx.moveTo(cx - 70 - (i % 5) * 8, y);
    ctx.lineTo(cx + 75 + (i % 4) * 7, y + ((i % 3) - 1) * 5);
    ctx.stroke();
  }

  return finalizeColorTexture(canvas, maxAnisotropy);
}

/**
 * Vertical wood grain for chopping block side wall
 */
export function createWoodBlockSideTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#854E27');
  grad.addColorStop(0.5, '#6F3E1D');
  grad.addColorStop(1, '#522C13');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let x = 0; x < size; x += 3) {
    ctx.fillStyle = x % 9 === 0 ? 'rgba(42, 20, 8, 0.24)' : 'rgba(180, 118, 66, 0.08)';
    ctx.fillRect(x, 0, 1.5, size);
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 3, 1);
}

/**
 * Classic crimson Chinese "福" diamond paper plaque
 */
export function createFuPosterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#C9271F');
  grad.addColorStop(1, '#9E1A14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(236, 191, 98, 0.55)';
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, size - 28, size - 28);

  ctx.fillStyle = '#18110E';
  ctx.font = 'bold 148px "Noto Serif SC", "Songti SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('福', size * 0.5, size * 0.53);

  return finalizeColorTexture(canvas, maxAnisotropy);
}

/**
 * Woven bamboo steamer texture
 */
export function createBambooSteamerTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#A88244';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 8) {
    ctx.fillStyle = y % 64 < 12 ? '#5E441E' : y % 16 === 0 ? '#977237' : '#B7904E';
    ctx.fillRect(0, y, size, 6);
  }

  ctx.fillStyle = 'rgba(60, 40, 14, 0.16)';
  for (let x = 0; x < size; x += 14) {
    ctx.fillRect(x, 0, 2, size);
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 2, 1);
}

/**
 * Blue-and-white porcelain bowl exterior texture
 */
export function createBlueWhiteBowlTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F2EFE8';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#244A86';
  ctx.fillRect(0, 26, size, 12);
  ctx.fillRect(0, 48, size, 6);

  for (let x = 8; x < size; x += 24) {
    ctx.beginPath();
    ctx.arc(x, 86, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillRect(0, 198, size, 7);

  return finalizeColorTexture(canvas, maxAnisotropy);
}

/**
 * Gas stove rotary knob dial faceplate texture (关 / 文 / 中 / 旺)
 */
export function createStoveDialTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#19191C';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Dial scale arc
  ctx.strokeStyle = 'rgba(255, 224, 190, 0.22)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 98, -Math.PI * 0.78, Math.PI * 0.18);
  ctx.stroke();

  // Colored flame power arc
  const grad = ctx.createLinearGradient(30, 128, 226, 128);
  grad.addColorStop(0, '#60A5FA');
  grad.addColorStop(0.5, '#F59E0B');
  grad.addColorStop(1, '#EF4444');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, 86, -Math.PI * 0.5, Math.PI * 0.16);
  ctx.stroke();

  const labels = [
    { text: '关', angle: -Math.PI * 0.75, color: '#CBD5E1' },
    { text: '文', angle: -Math.PI * 0.45, color: '#93C5FD' },
    { text: '中', angle: -Math.PI * 0.15, color: '#FCD34D' },
    { text: '旺', angle: Math.PI * 0.15, color: '#F87171' },
  ];

  ctx.font = 'bold 26px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  labels.forEach((l) => {
    const x = cx + Math.cos(l.angle) * 108;
    const y = cy + Math.sin(l.angle) * 108;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, x, y);
  });

  return finalizeColorTexture(canvas, maxAnisotropy);
}

/**
 * Soft radial contact shadow plane texture
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 12, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export interface CutLineRecord {
  ratio: number; // 0..1 from right to left along that axis
  quality: 'perfect' | 'good' | 'off';
}

export interface DynamicCutCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  redraw: (params: {
    baseColor: string;
    innerColor: string;
    shape: string;
    showGuides: boolean;
    activeDirection: number; // 0, 1, 2
    activeCutIndex: number; // 0..maxPerDir-1
    directions: number;
    cutsPerDirection: number;
    axis1Cuts: CutLineRecord[];
    axis2Cuts: CutLineRecord[];
    axis3Cuts: CutLineRecord[];
  }) => void;
}

/**
 * Dynamic ingredient texture canvas that paints BOTH:
 * 1) Crisp dashed "完美切线" (perfect guide lines) calibrated to block/shred/dice spacing,
 *    with the active next cut line highlighted in luminous gold.
 * 2) The player's actual cut marks right where their blade landed!
 */
export function createDynamicCutCanvas(maxAnisotropy: number): DynamicCutCanvas {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(maxAnisotropy, 8);

  const ratioToCoord = (ratio: number, invert = false) =>
    invert ? size * (0.1 + ratio * 0.8) : size * (0.9 - ratio * 0.8);

  const redraw: DynamicCutCanvas['redraw'] = ({
    baseColor,
    innerColor,
    shape,
    showGuides,
    activeDirection,
    activeCutIndex,
    directions,
    cutsPerDirection,
    axis1Cuts,
    axis2Cuts,
    axis3Cuts,
  }) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Organic surface texture detail per ingredient type
    if (shape === 'pork-belly') {
      ctx.fillStyle = '#F5E7DF';
      ctx.fillRect(0, size * 0.16, size, size * 0.22);
      ctx.fillStyle = '#BD5349';
      ctx.fillRect(0, size * 0.38, size, size * 0.24);
      ctx.fillStyle = '#F4E4DC';
      ctx.fillRect(0, size * 0.62, size, size * 0.18);
      ctx.fillStyle = '#B84C42';
      ctx.fillRect(0, size * 0.8, size, size * 0.2);
    } else if (shape === 'tofu') {
      ctx.fillStyle = 'rgba(210, 198, 178, 0.16)';
      for (let i = 0; i < 180; i++) {
        const px = ((i * 73) % 500) + 6;
        const py = ((i * 137) % 500) + 6;
        ctx.fillRect(px, py, 2, 2);
      }
    } else if (shape === 'cucumber') {
      ctx.fillStyle = 'rgba(20, 60, 22, 0.22)';
      for (let x = 0; x < size; x += 28) {
        ctx.fillRect(x, 0, 5, size);
      }
    } else if (shape === 'potato') {
      ctx.fillStyle = 'rgba(130, 92, 42, 0.14)';
      for (let i = 0; i < 45; i++) {
        const px = ((i * 97) % 480) + 16;
        const py = ((i * 163) % 480) + 16;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (shape === 'chicken' || shape === 'pork-loin') {
      ctx.strokeStyle = 'rgba(255, 240, 232, 0.28)';
      ctx.lineWidth = 2;
      for (let y = 12; y < size; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(size * 0.3, y + 6, size * 0.7, y - 6, size, y);
        ctx.stroke();
      }
    }

    // 1. Draw dashed "完美切线" guide grid so player sees exact target block/shred width
    if (showGuides && cutsPerDirection > 0) {
      const denom = cutsPerDirection + 1;

      const drawGuideLine = (axis: number, idx: number, isActiveTarget: boolean, isDone: boolean) => {
        if (isDone) return;
        const ratio = (idx + 1) / denom;
        const coord = ratioToCoord(ratio, axis === 2);

        ctx.save();
        ctx.setLineDash(isActiveTarget ? [14, 8] : [8, 10]);
        ctx.lineWidth = isActiveTarget ? 5 : 2.5;
        ctx.strokeStyle = isActiveTarget
          ? '#F59E0B'
          : axis === activeDirection
            ? 'rgba(200, 75, 29, 0.45)'
            : 'rgba(120, 90, 65, 0.22)';

        ctx.beginPath();
        if (axis === 0 || axis === 2) {
          ctx.moveTo(coord, 0);
          ctx.lineTo(coord, size);
        } else {
          ctx.moveTo(0, coord);
          ctx.lineTo(size, coord);
        }
        ctx.stroke();

        // Highlight golden edge markers on the current active target line
        if (isActiveTarget) {
          ctx.setLineDash([]);
          ctx.fillStyle = '#F59E0B';
          if (axis === 0 || axis === 2) {
            ctx.fillRect(coord - 5, 0, 10, 18);
            ctx.fillRect(coord - 5, size - 18, 10, 18);
          } else {
            ctx.fillRect(0, coord - 5, 18, 10);
            ctx.fillRect(size - 18, coord - 5, 18, 10);
          }
        }
        ctx.restore();
      };

      // Faint preview of secondary axis so player immediately sees block/shred proportions
      if (directions >= 2 && activeDirection === 0) {
        for (let i = 0; i < cutsPerDirection; i++) {
          drawGuideLine(1, i, false, false);
        }
      }

      // Active direction guide lines
      for (let i = 0; i < cutsPerDirection; i++) {
        const isDone =
          activeDirection === 0
            ? i < axis1Cuts.length
            : activeDirection === 1
              ? i < axis2Cuts.length
              : i < axis3Cuts.length;
        drawGuideLine(activeDirection, i, i === activeCutIndex, isDone);
      }
    }

    // 2. Draw player's actual realized slice marks
    const drawActualCut = (axis: number, cut: CutLineRecord) => {
      const coord = ratioToCoord(cut.ratio, axis === 2);
      const darkLine =
        cut.quality === 'perfect'
          ? 'rgba(42, 26, 15, 0.56)'
          : cut.quality === 'good'
            ? 'rgba(56, 38, 24, 0.48)'
            : 'rgba(125, 42, 28, 0.52)';

      ctx.save();
      if (axis === 0) {
        ctx.fillStyle = darkLine;
        ctx.fillRect(coord - 2, 0, 4, size);
        ctx.fillStyle = innerColor;
        ctx.globalAlpha = 0.65;
        ctx.fillRect(coord + 2, 0, 2, size);
      } else if (axis === 1) {
        ctx.fillStyle = darkLine;
        ctx.fillRect(0, coord - 2, size, 4);
        ctx.fillStyle = innerColor;
        ctx.globalAlpha = 0.65;
        ctx.fillRect(0, coord + 2, size, 2);
      } else {
        // 3rd direction subtle horizontal/cross dicing line with gleaming edge
        ctx.fillStyle = 'rgba(42, 26, 15, 0.45)';
        ctx.fillRect(coord - 1.5, 0, 3, size);
        ctx.fillStyle = '#FFFDF7';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(coord + 1.5, 0, 1.5, size);
      }
      ctx.restore();
    };

    axis1Cuts.forEach((c) => drawActualCut(0, c));
    axis2Cuts.forEach((c) => drawActualCut(1, c));
    axis3Cuts.forEach((c) => drawActualCut(2, c));

    texture.needsUpdate = true;
  };

  return { canvas, ctx, texture, redraw };
}
