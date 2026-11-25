/**
 * Generates tactile black-and-white canvas patterns for Korean school exam (한글 HWP) printing
 */
export function createPatternCanvas(type: 'diagonal1' | 'diagonal2' | 'crosshatch' | 'dots' | 'horizontal' | 'vertical', size: number = 12): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Black stroke
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 1.5;

  if (type === 'diagonal1') {
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size, 0);
    ctx.stroke();
  } else if (type === 'diagonal2') {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    ctx.stroke();
  } else if (type === 'crosshatch') {
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    ctx.stroke();
  } else if (type === 'dots') {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'horizontal') {
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
  } else if (type === 'vertical') {
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();
  }

  return canvas;
}

export function getExamPatterns(ctx: CanvasRenderingContext2D): CanvasPattern[] {
  const patternTypes: ('diagonal1' | 'crosshatch' | 'dots' | 'diagonal2' | 'horizontal' | 'vertical')[] = [
    'diagonal1',
    'crosshatch',
    'dots',
    'diagonal2',
    'horizontal',
    'vertical'
  ];

  return patternTypes.map(t => {
    const pCanvas = createPatternCanvas(t);
    return ctx.createPattern(pCanvas, 'repeat') as CanvasPattern;
  });
}
