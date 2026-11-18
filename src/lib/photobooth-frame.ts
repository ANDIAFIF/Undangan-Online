export const photoboxLayouts = [
  { id: 'strip', label: 'Photostrip', width: 680, height: 1680, slots: [[40, 70, 600, 450], [40, 550, 600, 450], [40, 1030, 600, 450]] },
  { id: 'grid', label: 'Grid 2×2', width: 1280, height: 1180, slots: [[40, 70, 588, 441], [652, 70, 588, 441], [40, 535, 588, 441], [652, 535, 588, 441]] },
  { id: 'portrait', label: 'Potret', width: 840, height: 1260, slots: [[40, 70, 760, 950]] },
  { id: 'duet', label: 'Duet', width: 680, height: 1230, slots: [[40, 70, 600, 450], [40, 670, 600, 450]] },
] as const;

// Frame artwork from Inveet, supplied by the invitation owner with permission.
export const photoboxFrames = [
  { id: 'botanical-editorial', label: 'Botanical', category: 'Elegan' },
  { id: 'fairy-garden', label: 'Fairy Garden', category: 'Doodle' },
  { id: 'nusantara-textile', label: 'Nusantara', category: 'Tradisional' },
  { id: 'terracotta-herbarium', label: 'Herbarium', category: 'Elegan' },
  { id: 'indigo-jasmine', label: 'Nila Melati', category: 'Tradisional' },
  { id: 'moonlit-filigree', label: 'Rembulan', category: 'Elegan' },
  { id: 'linen-emboss', label: 'Linen', category: 'Elegan' },
  { id: 'champagne-peony', label: 'Peony Champagne', category: 'Elegan' },
  { id: 'burgundy-salon', label: 'Salon Burgundy', category: 'Elegan' },
  { id: 'blush-atelier', label: 'Atelier Blush', category: 'Elegan' },
  { id: 'emerald-conservatory', label: 'Konservatori Zamrud', category: 'Elegan' },
  { id: 'porcelain-reverie', label: 'Porselen Biru', category: 'Elegan' },
  { id: 'onyx-orchid', label: 'Anggrek Onyx', category: 'Elegan' },
  { id: 'songket-champagne', label: 'Songket Champagne', category: 'Tradisional' },
  { id: 'plum-magnolia', label: 'Magnolia Plum', category: 'Elegan' },
  { id: 'frosted-lace', label: 'Renda Kristal', category: 'Elegan' },
  { id: 'sepia-rosette', label: 'Rosette Sepia', category: 'Elegan' },
  { id: 'modern-colorblock', label: 'Blok Warna', category: 'Modern' },
  { id: 'modern-chrome-noir', label: 'Krom Noir', category: 'Modern' },
  { id: 'modern-pastel-arch', label: 'Lengkung Pastel', category: 'Modern' },
  { id: 'doodle-love-notes', label: 'Coretan Cinta', category: 'Doodle' },
  { id: 'doodle-crayon-garden', label: 'Taman Krayon', category: 'Doodle' },
  { id: 'doodle-chalkboard', label: 'Papan Kapur', category: 'Doodle' },
  { id: 'elegant-deco-gilt', label: 'Deco Emas', category: 'Elegan' },
  { id: 'elegant-silk-sage', label: 'Sutra Sage', category: 'Elegan' },
  { id: 'tradisi-batik-sogan', label: 'Batik Sogan', category: 'Tradisional' },
  { id: 'tradisi-gunungan-prada', label: 'Gunungan Prada', category: 'Tradisional' },
  { id: 'tradisi-bali-prada', label: 'Prada Bali', category: 'Tradisional' },
] as const;

export type PhotoboxLayout = (typeof photoboxLayouts)[number];
export type PhotoboxFrame = (typeof photoboxFrames)[number];

export function photoboxArtworkPath(frame: PhotoboxFrame) {
  return `/photobooth/frames/${frame.id}.jpg`;
}

export async function loadPhotoboxImage(src: string) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

export const photoboxFonts = [
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Sans', value: 'Arial, sans-serif' },
  { label: 'Mesin tik', value: 'monospace' },
  { label: 'Tulisan tangan', value: 'cursive' },
] as const;

export const photoboxShapes = [
  { label: 'Kotak', value: 'square' },
  { label: 'Membulat', value: 'round' },
  { label: 'Lengkung', value: 'arch' },
  { label: 'Oval', value: 'oval' },
] as const;

export type PhotoboxShape = (typeof photoboxShapes)[number]['value'];

function photoPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, shape: PhotoboxShape) {
  ctx.beginPath();
  if (shape === 'oval') {
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else if (shape === 'arch') {
    const radius = Math.min(width / 2, height * .45);
    ctx.roundRect(x, y, width, height, [radius, radius, 6, 6]);
  } else if (shape === 'round') {
    ctx.roundRect(x, y, width, height, 36);
  } else {
    ctx.rect(x, y, width, height);
  }
}


export function drawPhotoboxFrame(
  ctx: CanvasRenderingContext2D,
  photos: HTMLImageElement[],
  { layout, artwork, background, couple, date, filter = 'none', font = photoboxFonts[0].value, shape = 'square' }: {
    layout: PhotoboxLayout;
    artwork?: HTMLImageElement;
    background?: string;
    couple: string;
    date: string;
    filter?: string;
    font?: string;
    shape?: PhotoboxShape;
  },
) {
  const { width, height, slots } = layout;
  ctx.save();
  ctx.fillStyle = '#f6eddf';
  ctx.fillRect(0, 0, width, height);
  if (artwork) ctx.drawImage(artwork, 0, 0, width, height);

  const printMargin = Math.round(width * .14);
  const scale = (width - 2 * printMargin) / (width - 80);
  const printColor = background ?? '#fff9ee';
  slots.forEach(([slotX, slotY, slotWidth, slotHeight], index) => {
    // Leave the art visible around the print and keep the camera's original crop ratio.
    const x = printMargin + (slotX - 40) * scale;
    const w = slotWidth * scale;
    const h = slotHeight * scale;
    const y = slotY + (slotHeight - h) / 2;
    ctx.fillStyle = printColor;
    photoPath(ctx, x - 5, y - 5, w + 10, h + 10, shape);
    ctx.fill();

    ctx.save();
    photoPath(ctx, x, y, w, h, shape);
    ctx.clip();
    const photo = photos.length ? photos[index % photos.length] : undefined;
    if (photo) {
      const ratio = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
      const cropWidth = w / ratio;
      const cropHeight = h / ratio;
      ctx.filter = filter;
      ctx.drawImage(photo, (photo.naturalWidth - cropWidth) / 2, (photo.naturalHeight - cropHeight) / 2, cropWidth, cropHeight, x, y, w, h);
    } else {
      ctx.fillStyle = '#c4b19a';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#3a2e2a';
      ctx.textAlign = 'center';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(String(index + 1), x + w / 2, y + h / 2 + 15);
    }
    ctx.restore();
  });

  const titleY = layout.id === 'duet' ? 562 : height - 120;
  const captionWidth = width - 2 * printMargin;
  ctx.fillStyle = printColor;
  ctx.beginPath();
  ctx.roundRect(printMargin, titleY - 27, captionWidth, 112, 9);
  ctx.fill();
  const [red, green, blue] = [1, 3, 5].map(offset => parseInt(printColor.slice(offset, offset + 2), 16));
  ctx.fillStyle = red * .299 + green * .587 + blue * .114 >= 140 ? '#342820' : '#fff9ee';
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('Wedding Day', width / 2, titleY, captionWidth - 28);
  ctx.font = 'bold 34px ' + font;
  ctx.fillText(couple, width / 2, titleY + 40, captionWidth - 28);
  ctx.font = '23px ' + font;
  ctx.fillText(date, width / 2, titleY + 70, captionWidth - 28);
  ctx.restore();
}
