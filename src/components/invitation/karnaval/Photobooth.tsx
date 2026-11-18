'use client';

import { useEffect, useRef, useState } from 'react';
import { acquireCamera, cameraErrorMessage, cameraHasFrame, startCameraPreview, stopCameraStream } from '@/lib/photobooth-camera';
import { drawPhotoboxFrame, loadPhotoboxImage, photoboxArtworkPath, photoboxFonts, photoboxFrames, photoboxLayouts, photoboxShapes, type PhotoboxFrame, type PhotoboxLayout, type PhotoboxShape } from '@/lib/photobooth-frame';
import PhotoboxPreview from './PhotoboxPreview';

type Stage = 'layout' | 'camera' | 'review' | 'decorate';
type CameraState = 'idle' | 'starting' | 'ready' | 'error';
type Facing = 'user' | 'environment';

const editorPanels = ['Bingkai', 'Font', 'Bentuk', 'Filter'] as const;
const frameCategories = ['Semua', 'Modern', 'Doodle', 'Elegan', 'Tradisional'] as const;

const filters = [
  ['Asli', 'none'], ['Klasik', 'saturate(.75) contrast(1.13)'],
  ['Mono', 'grayscale(1)'], ['Noir', 'grayscale(1) contrast(1.45)'],
  ['Sepia', 'sepia(.76)'], ['Hangat', 'sepia(.24) saturate(1.34)'],
  ['Sejuk', 'sepia(.24) hue-rotate(165deg) saturate(.85)'], ['Pudar', 'contrast(.78) brightness(1.14) saturate(.75)'],
];

const stages = [
  { id: 'layout', label: 'Format' },
  { id: 'camera', label: 'Sesi foto' },
  { id: 'decorate', label: 'Bingkai & simpan' },
] as const;

const countdownSeconds = 3;
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

function preparePhoto(source: CanvasImageSource, width: number, height: number, zoom = 1, mirror = false) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1280 / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Foto tidak bisa diproses di browser ini.');
  if (mirror) {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }
  const cropWidth = width / zoom;
  const cropHeight = height / zoom;
  context.drawImage(source, (width - cropWidth) / 2, (height - cropHeight) / 2,
    cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', .92);
}

export default function Photobooth({ couple, date }: { couple: string; date: string }) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const operation = useRef<AbortController | null>(null);
  const workVersion = useRef(0);
  const taking = useRef(false);
  const [stage, setStage] = useState<Stage>('layout');
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [facing, setFacing] = useState<Facing>('user');
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [automatic, setAutomatic] = useState(false);
  const [guide, setGuide] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [retake, setRetake] = useState<number | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [result, setResult] = useState<{ url: string; file: File }>();
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('none');
  const [color, setColor] = useState<string>();
  const [panel, setPanel] = useState<(typeof editorPanels)[number]>('Bingkai');
  const [category, setCategory] = useState<(typeof frameCategories)[number]>('Semua');
  const [font, setFont] = useState<string>(photoboxFonts[0].value);
  const [shape, setShape] = useState<PhotoboxShape>('square');
  const [frame, setFrame] = useState<PhotoboxFrame>(photoboxFrames[0]);
  const [layout, setLayout] = useState<PhotoboxLayout>(photoboxLayouts[0]);
  const poseCount = layout.slots.length;
  const [, , previewWidth, previewHeight] = layout.slots[0];

  useEffect(() => {
    const element = video.current;
    return () => {
      workVersion.current++;
      operation.current?.abort();
      stopCameraStream(stream.current);
      stream.current = null;
      if (element) {
        element.pause();
        element.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    root.current?.closest('.kk-modal-body')?.scrollTo({ top: 0, behavior: 'instant' });
  }, [stage]);

  function releaseCamera() {
    operation.current?.abort();
    operation.current = null;
    stopCameraStream(stream.current);
    stream.current = null;
    if (video.current) {
      video.current.pause();
      video.current.srcObject = null;
    }
    setCameraState('idle');
  }

  function cancelWork() {
    workVersion.current++;
    taking.current = false;
    setBusy(false);
    setCount(0);
    setFlash(false);
    releaseCamera();
    setError('');
  }

  async function startCamera(direction: Facing) {
    releaseCamera();
    const controller = new AbortController();
    operation.current = controller;
    setCameraState('starting');
    setError('');
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new DOMException('Secure context required', 'SecurityError');
      }
      const acquired = await acquireCamera(navigator.mediaDevices, controller.signal, direction);
      if (controller.signal.aborted) {
        stopCameraStream(acquired);
        return;
      }
      stream.current = acquired;
      const element = video.current;
      if (!element) throw new DOMException('Preview closed', 'AbortError');
      await startCameraPreview(element, acquired, controller.signal);
      if (controller.signal.aborted) return;

      acquired.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
        if (operation.current !== controller) return;
        cancelWork();
        setCameraState('error');
        setError('Kamera terputus. Aktifkan lagi untuk melanjutkan pose.');
      }, { once: true }));
      setFacing(direction);
      setCameraState('ready');
    } catch (cause) {
      if (controller.signal.aborted) return;
      releaseCamera();
      setCameraState('error');
      if (direction === 'environment' && ['NotFoundError', 'OverconstrainedError'].includes((cause as DOMException).name)) {
        setError('Kamera belakang tidak tersedia. Aktifkan kamera depan untuk lanjut.');
      } else {
        setError(cameraErrorMessage(cause));
      }
    }
  }

  function goTo(next: Stage) {
    cancelWork();
    setStage(next);
  }

  function begin(nextLayout: PhotoboxLayout) {
    setLayout(nextLayout);
    setShots([]);
    setResult(undefined);
    setRetake(null);
    goTo('camera');
    void startCamera('user');
  }

  function startRetake(index: number | null) {
    if (index === null) setShots([]);
    setRetake(index);
    goTo('camera');
    void startCamera(facing);
  }

  async function shoot() {
    if (busy || taking.current || cameraState !== 'ready') return;
    taking.current = true;
    const version = ++workVersion.current;
    const next = [...shots];
    const target = retake ?? next.length;
    const end = automatic && retake === null ? poseCount : target + 1;
    setBusy(true);
    setError('');

    try {
      for (let index = target; index < end; index++) {
        for (let remaining = countdownSeconds; remaining > 0; remaining--) {
          if (workVersion.current !== version) return;
          setCount(remaining);
          await wait(1000);
        }
        if (workVersion.current !== version) return;
        setCount(0);
        const element = video.current;
        if (!element || !cameraHasFrame(element) || element.paused ||
          !stream.current?.getVideoTracks().some(track => track.readyState === 'live' && !track.muted)) {
          throw new Error('Gambar kamera terhenti. Aktifkan kembali kamera untuk melanjutkan.');
        }
        next[index] = preparePhoto(element, element.videoWidth, element.videoHeight, zoom, facing === 'user');
        setShots([...next]);
        setFlash(true);
        await wait(180);
        if (workVersion.current !== version) return;
        setFlash(false);
        if (index + 1 < end) await wait(450);
      }

      if (workVersion.current === version && (retake !== null || next.length === poseCount)) {
        releaseCamera();
        setRetake(null);
        setStage('review');
      }
    } catch (cause) {
      if (workVersion.current === version) {
        releaseCamera();
        setCameraState('error');
        setError(cause instanceof Error ? cause.message : 'Foto gagal diambil. Coba lagi.');
      }
    } finally {
      if (workVersion.current === version) {
        taking.current = false;
        setBusy(false);
        setCount(0);
        setFlash(false);
      }
    }
  }

  async function upload(files: FileList | null) {
    if (!files?.length || busy) return;
    cancelWork();
    const version = workVersion.current;
    setBusy(true);
    const next = retake === null ? [] : [...shots];
    try {
      const limit = retake === null ? poseCount : 1;
      for (const [index, file] of Array.from(files).slice(0, limit).entries()) {
        if (file.size > 10 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
          throw new Error('Pilih JPG, PNG, atau WebP maksimal 10 MB.');
        }
        const url = URL.createObjectURL(file);
        try {
          const image = new Image();
          image.src = url;
          await image.decode();
          if (workVersion.current !== version) return;
          next[retake ?? index] = preparePhoto(image, image.naturalWidth, image.naturalHeight);
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      setShots(next);
      setRetake(null);
      setStage('review');
    } catch (cause) {
      if (workVersion.current === version) {
        setError(cause instanceof Error ? cause.message : 'Foto tidak bisa dibaca.');
      }
    } finally {
      if (workVersion.current === version) setBusy(false);
    }
  }

  useEffect(() => {
    if (stage !== 'decorate') return;
    let active = true;
    setResult(undefined);
    setError('');

    async function render() {
      const canvas = document.createElement('canvas');
      canvas.width = layout.width;
      canvas.height = layout.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('PNG tidak bisa dibuat di browser ini.');
      const [artwork, photos] = await Promise.all([
        loadPhotoboxImage(photoboxArtworkPath(frame)),
        Promise.all(shots.map(loadPhotoboxImage)),
      ]);
      if (!active) return;
      drawPhotoboxFrame(context, photos, { layout, artwork, background: color, couple, date, filter, font, shape });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!active) return;
      if (!blob) throw new Error('PNG tidak bisa dibuat di browser ini.');
      const file = new File([blob], `kenangan-${layout.id}-${frame.id}.png`, { type: 'image/png' });
      setResult({ url: URL.createObjectURL(file), file });
    }

    void render().catch(() => {
      if (active) setError('Bingkai gagal dibuat. Pilih bingkai lain untuk mencoba lagi.');
    });
    return () => { active = false; };
  }, [stage, shots, layout, frame, color, couple, date, filter, font, shape]);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  async function sharePhoto() {
    if (!result || !navigator.canShare?.({ files: [result.file] })) return;
    try {
      await navigator.share({ files: [result.file], title: couple });
    } catch (cause) {
      if ((cause as DOMException)?.name !== 'AbortError') setError('Foto gagal dibagikan. Coba simpan PNG dulu.');
    }
  }

  const starting = cameraState === 'starting';
  const currentPose = retake ?? Math.min(shots.length, poseCount - 1);
  const activeStage = stage === 'review' ? 'camera' : stage;
  const canShare = result && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [result.file] });
  const filterChoices = <div className="kk-photo-filters" role="group" aria-label="Filter foto">
    {filters.map(([label, value]) => <button key={label} type="button" aria-pressed={filter === value}
      className="kk-button secondary" disabled={busy} onClick={() => setFilter(value)}>{label}</button>)}
  </div>;

  return <div ref={root} className="kk-photobooth">
    <ol className="kk-photo-steps" aria-label="Tahap photobooth">
      {stages.map(item => <li key={item.id} aria-current={item.id === activeStage ? 'step' : undefined}>{item.label}</li>)}
    </ol>

    {stage === 'layout' && <fieldset className="kk-photo-choices">
      <legend>Tata letak foto</legend>
      <div className="kk-template-grid">
        {photoboxLayouts.map(option => <button key={option.id} type="button" className="kk-template-card"
          onClick={() => begin(option)}>
          <PhotoboxPreview layout={option} frame={frame} couple={couple} date={date} />
          <span>{option.label}</span><small>{option.slots.length} foto</small>
        </button>)}
      </div>
      <p><small>Pilih format untuk membuka kamera. Tamu juga bisa memilih foto dari perangkat.</small></p>
    </fieldset>}

    <section className="kk-photo-session" hidden={stage !== 'camera'} aria-label="Sesi foto">
      <div className="kk-photo-heading">
        <button type="button" className="kk-button secondary" onClick={() => goTo(retake === null ? 'layout' : 'review')}>Kembali</button>
        <b>{layout.label} · {currentPose + 1}/{poseCount}</b>
      </div>
      <div className="kk-camera-console">
        <div className="kk-camera-toolbar">
          <button type="button" aria-pressed={guide} onClick={() => setGuide(!guide)}>Garis bantu</button>
          <button type="button" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}>Filter</button>
          <span className="kk-camera-timer" aria-label="Timer 3 detik">3 dtk</span>
        </div>
        {showFilters && filterChoices}
        <div className="kk-camera" aria-busy={starting} style={{ aspectRatio: previewWidth / previewHeight }}>
          <video ref={video} autoPlay playsInline muted aria-label="Pratinjau kamera"
            style={{ filter, transform: `scale(${facing === 'user' ? -zoom : zoom}, ${zoom})` }} />
          {cameraState !== 'ready' && <span>{starting ? 'Membuka kamera…' : 'Siap berpose?'}</span>}
          {guide && cameraState === 'ready' && <div className="kk-camera-guide" aria-hidden="true" />}
          {flash && <div className="kk-camera-flash" aria-hidden="true" />}
          <div className="kk-camera-countdown" role="status" aria-atomic="true">
            {count > 0 && <><span className="kk-countdown-number" key={count} aria-hidden="true">{count}</span><span className="sr-only">{count} detik</span></>}
          </div>
          {cameraState === 'ready' && <div className="kk-camera-zoom" role="group" aria-label="Zoom kamera">
            {[1, 2].map(value => <button key={value} type="button" aria-pressed={zoom === value}
              disabled={busy} onClick={() => setZoom(value)}>{value}×</button>)}
          </div>}
        </div>
        <div className="kk-camera-actions">
          <button type="button" className="kk-camera-mode" aria-pressed={automatic} disabled={busy}
            onClick={() => setAutomatic(!automatic)}>{automatic ? 'Otomatis' : 'Manual'}</button>
          {cameraState === 'ready' ?
            <button type="button" className="kk-shutter" disabled={busy} onClick={() => void shoot()}
              aria-label={automatic && retake === null ? 'Mulai sesi otomatis' : 'Ambil foto'}>
              <span className="kk-shutter-ring" aria-hidden="true" />
            </button> :
            <button type="button" className="kk-camera-retry" disabled={starting || busy}
              onClick={() => void startCamera(facing)}>Aktifkan kamera</button>}
          <button type="button" className="kk-camera-switch" disabled={starting || busy || cameraState !== 'ready'}
            onClick={() => void startCamera(facing === 'user' ? 'environment' : 'user')} aria-label="Ganti kamera">
            <span aria-hidden="true">↻</span>
          </button>
        </div>
      </div>
      <div className="kk-row">
        <button type="button" className="kk-button secondary" disabled={busy} onClick={() => fileInput.current?.click()}>Pilih foto</button>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple={retake === null && poseCount > 1}
          disabled={busy} onChange={e => { void upload(e.target.files); e.target.value = ''; }} hidden />
      </div>
      {shots.length > 0 && retake === null && <p role="status">{shots.length}/{poseCount} pose tersimpan</p>}
    </section>

    {stage === 'review' && <section aria-label="Tinjau pose">
      <div className="kk-photo-heading">
        <button type="button" className="kk-button secondary" onClick={() => goTo('layout')}>Kembali</button>
        <b>Tinjau pose</b>
      </div>
      <div className="kk-photo-review">
        {shots.map((shot, index) => <button key={index} type="button" className="kk-template-card"
          aria-label={`Ulangi pose ${index + 1}`} onClick={() => startRetake(index)}>
          <img src={shot} alt="" style={{ filter, aspectRatio: previewWidth / previewHeight }} />
          <span>Ulang pose {index + 1}</span>
        </button>)}
      </div>
      {shots.length < poseCount && <p><small>Foto akan diulang untuk mengisi {poseCount} slot.</small></p>}
      <div className="kk-row">
        <button type="button" className="kk-button secondary" onClick={() => startRetake(null)}>Ulang semua</button>
        <button type="button" className="kk-button" onClick={() => goTo('decorate')}>Pilih bingkai</button>
      </div>
    </section>}

    {stage === 'decorate' && <section aria-label="Hias dan simpan">
      <div className="kk-photo-heading">
        <button type="button" className="kk-button secondary" onClick={() => goTo('review')}>Kembali ke pose</button>
        <b>{layout.label}</b>
      </div>
      <div className="kk-photo-result" aria-busy={!result && !error}>
        {result ? <img className="kk-photo-strip" src={result.url} alt={`Hasil photobox ${layout.label}`} /> :
          <PhotoboxPreview layout={layout} frame={frame} background={color} couple={couple} date={date} />}
      </div>
      <div className="kk-row">
        {result && <a className="kk-button" href={result.url} download={result.file.name}>Simpan PNG</a>}
        {canShare && <button type="button" className="kk-button secondary" onClick={() => void sharePhoto()}>Bagikan</button>}
        <button type="button" className="kk-button secondary" onClick={() => goTo('layout')}>Sesi baru</button>
      </div>
      <div className="kk-photo-editor-nav" role="group" aria-label="Pengaturan hasil foto">
        {editorPanels.map(option => <button type="button" key={option} className="kk-button secondary"
          aria-pressed={option === panel} onClick={() => setPanel(option)}>{option}</button>)}
      </div>
      {panel === 'Bingkai' && <>
        <div className="kk-photo-filters" role="group" aria-label="Kategori bingkai">
          {frameCategories.map(option => <button type="button" key={option} className="kk-button secondary"
            aria-pressed={option === category} onClick={() => setCategory(option)}>{option}</button>)}
        </div>
        <fieldset className="kk-photo-choices">
          <legend>Desain bingkai</legend>
          <div className="kk-photo-frame-scroll">
            <div className="kk-template-grid kk-frame-grid">
              {photoboxFrames.filter(option => category === 'Semua' || option.category === category).map(option =>
                <button key={option.id} type="button" className="kk-template-card"
                  aria-pressed={frame.id === option.id} onClick={() => { setFrame(option); setColor(undefined); }}>
                  <img className="kk-template-artwork" src={photoboxArtworkPath(option)} alt="" loading="lazy" decoding="async" />
                  <span>{option.label}</span>
                </button>)}
            </div>
          </div>
        </fieldset>
        <label className="kk-label">Warna tepi foto<input type="color" value={color ?? '#fff9ee'}
          onChange={e => setColor(e.target.value)} /></label>
      </>}
      {panel === 'Font' && <div className="kk-photo-filters" role="group" aria-label="Pilihan font">
        {photoboxFonts.map(option => <button type="button" key={option.value} className="kk-button secondary"
          style={{ fontFamily: option.value }} aria-pressed={font === option.value}
          onClick={() => setFont(option.value)}>{option.label}</button>)}
      </div>}
      {panel === 'Bentuk' && <div className="kk-photo-filters" role="group" aria-label="Bentuk foto">
        {photoboxShapes.map(option => <button type="button" key={option.value} className="kk-button secondary"
          aria-pressed={shape === option.value} onClick={() => setShape(option.value)}>{option.label}</button>)}
      </div>}
      {panel === 'Filter' && filterChoices}
    </section>}

    {error && <p role="alert">{error}</p>}
    <small>Foto diproses di perangkatmu.</small>
  </div>;
}
