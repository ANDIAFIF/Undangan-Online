export type PhotoboxFrame = 'carnival' | 'ticket' | 'classic';

// The exported PNG uses the same 4:3 crop as the live camera preview.
export function drawPhotoboxFrame(
  ctx: CanvasRenderingContext2D,
  photos: CanvasImageSource[],
  options: { design: PhotoboxFrame; background: string; couple: string; date: string },
) {
  const { design, background, couple, date } = options;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 680, 1680);
  const ink = '#233f33';
  const accents = ['#b74c62', '#e6b849', '#629c8a'];
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, 652, 1652);
  if (design === 'carnival') {
    // Bunting and pixel confetti stay in the margins, never over a face.
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = accents[i % accents.length];
      ctx.beginPath();
      ctx.moveTo(28 + i * 52, 22);
      ctx.lineTo(74 + i * 52, 22);
      ctx.lineTo(51 + i * 52, 56);
      ctx.fill();
    }
    for (let y = 92; y < 1490; y += 48) {
      ctx.fillStyle = accents[Math.floor(y / 48) % 3];
      ctx.fillRect(22, y, 8, 12);
      ctx.fillRect(650, y + 16, 8, 12);
    }
  } else if (design === 'ticket') {
    ctx.fillStyle = ink;
    for (let y = 42; y < 1640; y += 32) {
      ctx.fillRect(22, y, 8, 14);
      ctx.fillRect(650, y, 8, 14);
    }
    ctx.setLineDash([9, 7]);
    ctx.beginPath(); ctx.moveTo(42, 1520); ctx.lineTo(638, 1520); ctx.stroke();
    ctx.setLineDash([]);
  }
  photos.slice(0, 3).forEach((photo, index) => {
    const y = 70 + index * 480;
    ctx.fillStyle = ink;
    ctx.fillRect(36, y - 4, 608, 458);
    ctx.drawImage(photo, 40, y, 600, 450);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = 'bold 26px monospace';
  ctx.fillText(design === 'ticket' ? 'TIKET KENANGAN' : 'KARNAVAL KITA', 340, 1558, 590);
  ctx.font = 'bold 30px serif';
  ctx.fillText(couple, 340, 1602, 590);
  ctx.font = '23px serif';
  ctx.fillText(date, 340, 1640, 590);
}
