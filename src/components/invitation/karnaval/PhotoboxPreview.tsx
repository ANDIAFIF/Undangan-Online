import { useEffect, useRef } from 'react';
import { drawPhotoboxFrame, loadPhotoboxImage, photoboxArtworkPath, type PhotoboxFrame, type PhotoboxLayout } from '@/lib/photobooth-frame';

export default function PhotoboxPreview({ layout, frame, background, couple, date }: {
  layout: PhotoboxLayout;
  frame: PhotoboxFrame;
  background?: string;
  couple: string;
  date: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    let active = true;
    context.setTransform(.25, 0, 0, .25, 0, 0);
    drawPhotoboxFrame(context, [], { layout, background, couple, date });
    void loadPhotoboxImage(photoboxArtworkPath(frame)).then(artwork => {
      if (active) drawPhotoboxFrame(context, [], { layout, artwork, background, couple, date });
    }).catch(() => {});
    return () => { active = false; };
  }, [layout, frame, background, couple, date]);

  return <canvas ref={canvas} width={layout.width / 4} height={layout.height / 4} aria-hidden="true" />;
}
