'use client';

import { useEffect, useRef, useState } from 'react';
import { acquireCamera, cameraErrorMessage, cameraHasFrame, startCameraPreview, stopCameraStream } from '@/lib/photobooth-camera';

import { drawPhotoboxFrame, type PhotoboxFrame } from '@/lib/photobooth-frame';

type CameraState = 'idle' | 'starting' | 'ready' | 'error';

export default function Photobooth({ couple, date }: { couple: string; date: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const operation = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const requesting = useRef(false);
  const workVersion = useRef(0);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const [shots, setShots] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('none');
  const [color, setColor] = useState('#fff3d4');
  const [frame, setFrame] = useState<PhotoboxFrame>('carnival');

  useEffect(() => {
    mounted.current = true;
    const element = video.current;
    return () => {
      mounted.current = false;
      workVersion.current++;
      operation.current?.abort();
      stopCameraStream(stream.current);
      stream.current = null;
      requesting.current = false;
      if (element) { element.pause(); element.srcObject = null; }
    };
  }, []);

  function stopCamera() {
    operation.current?.abort();
    operation.current = null;
    requesting.current = false;
    workVersion.current++;
    stopCameraStream(stream.current);
    stream.current = null;
    if (video.current) { video.current.pause(); video.current.srcObject = null; }
    setCameraState('idle');
    setBusy(false);
    setCount(0);
  }

  async function camera() {
    // Lock synchronously: rapid taps must never open two streams simultaneously.
    if (requesting.current) return;
    stopCamera();
    const controller = new AbortController();
    operation.current = controller;
    requesting.current = true;
    setCameraState('starting');
    setError('');
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError('Kamera membutuhkan HTTPS atau localhost. Buka undangan lewat localhost di komputer ini, atau tautan HTTPS di HP.');
        setCameraState('error');
        return;
      }
      const acquired = await acquireCamera(navigator.mediaDevices, controller.signal);
      if (!mounted.current || controller.signal.aborted) { stopCameraStream(acquired); return; }
      stream.current = acquired;
      const element = video.current;
      if (!element) throw new DOMException('Preview closed', 'AbortError');
      // Permission granted is not enough: wait until usable video frames arrive.
      await startCameraPreview(element, acquired, controller.signal);
      if (!mounted.current || controller.signal.aborted) return;
      acquired.getVideoTracks().forEach((track) => track.addEventListener('ended', () => {
        if (!mounted.current || operation.current !== controller) return;
        stopCamera();
        setCameraState('error');
        setError('Kamera terputus atau dihentikan perangkat. Ketuk Coba lagi untuk menyalakannya.');
      }, { once: true }));
      setCameraState('ready');
    } catch (cause) {
      if (!mounted.current || controller.signal.aborted || operation.current !== controller) return;
      stopCamera();
      setCameraState('error');
      setError(cameraErrorMessage(cause));
    } finally {
      if (operation.current === controller) requesting.current = false;
    }
  }

  const currentWork = (version: number) => mounted.current && workVersion.current === version;
  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  async function compose(photos: string[], version: number, design = frame, background = color) {
    if (!photos.length) return;
    const canvas = document.createElement('canvas');
    canvas.width = 680;
    canvas.height = 1680;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Gambar tidak bisa diproses di browser ini.');
    const images = await Promise.all(Array.from({ length: 3 }, async (_, i) => {
      const image = new Image();
      image.src = photos[i % photos.length];
      await image.decode();
      return image;
    }));
    if (!currentWork(version)) return;
    drawPhotoboxFrame(context, images, { design, background, couple, date });
    if (currentWork(version)) setResult(canvas.toDataURL('image/png'));
  }

  async function shoot() {
    if (busy || cameraState !== 'ready') return;
    const version = ++workVersion.current;
    setBusy(true);
    setResult('');
    setError('');
    const next: string[] = [];
    try {
      for (let i = 0; i < 3; i++) {
        for (let n = 3; n > 0; n--) {
          if (!currentWork(version)) return;
          setCount(n);
          await wait(850);
        }
        if (!currentWork(version)) return;
        setCount(0);
        const element = video.current;
        if (!element || !cameraHasFrame(element) || element.paused ||
            !stream.current?.getVideoTracks().some((track) => track.readyState === 'live' && !track.muted)) {
          throw new Error('Gambar kamera terhenti. Mulai ulang kamera sebelum mengambil foto lagi.');
        }
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 450;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Foto tidak bisa diproses di browser ini.');
        context.filter = filter;
        context.translate(600, 0);
        context.scale(-1, 1);
        const ratio = Math.max(600 / element.videoWidth, 450 / element.videoHeight);
        context.drawImage(element, (600 - element.videoWidth * ratio) / 2,
          (450 - element.videoHeight * ratio) / 2, element.videoWidth * ratio, element.videoHeight * ratio);
        next.push(canvas.toDataURL('image/jpeg', .9));
        setShots([...next]);
        await wait(250);
      }
      await compose(next, version);
    } catch (cause) {
      if (currentWork(version)) {
        stopCamera();
        setCameraState('error');
        setError(cause instanceof Error ? cause.message : 'Foto gagal diambil. Coba lagi.');
      }
    } finally {
      if (currentWork(version)) { setBusy(false); setCount(0); }
    }
  }

  async function upload(files: FileList | null) {
    if (!files?.length || busy) return;
    const version = ++workVersion.current;
    setError('');
    setBusy(true);
    const next: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, 3)) {
        if (file.size > 10 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
          throw new Error('Pilih JPG, PNG, atau WebP maksimal 10 MB.');
        }
        const url = URL.createObjectURL(file);
        try {
          const image = new Image();
          image.src = url;
          await image.decode();
          if (!currentWork(version)) return;
          const canvas = document.createElement('canvas');
          canvas.width = 600;
          canvas.height = 450;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Foto tidak bisa diproses di browser ini.');
          context.filter = filter;
          const ratio = Math.max(600 / image.width, 450 / image.height);
          context.drawImage(image, (600 - image.width * ratio) / 2, (450 - image.height * ratio) / 2,
            image.width * ratio, image.height * ratio);
          next.push(canvas.toDataURL('image/jpeg', .9));
        } finally { URL.revokeObjectURL(url); }
      }
      if (currentWork(version)) setShots(next);
      await compose(next, version);
    } catch (cause) {
      if (currentWork(version)) setError(cause instanceof Error ? cause.message : 'Foto tidak bisa dibaca.');
    } finally { if (currentWork(version)) setBusy(false); }
  }

  async function applyFrame(design = frame, background = color) {
    if (!shots.length) return;
    const version = ++workVersion.current;
    setBusy(true);
    try { await compose(shots, version, design, background); }
    catch { if (currentWork(version)) setError('Bingkai gagal dibuat. Coba lagi.'); }
    finally { if (currentWork(version)) setBusy(false); }
  }

  const starting = cameraState === 'starting';
  return <div className="kk-photobooth">
    <p>Ambil tiga pose, pilih bingkai, lalu simpan kenangan dari karnaval kami.</p>
    <div className="kk-camera" aria-busy={starting}>
      <video ref={video} autoPlay playsInline muted aria-label="Pratinjau kamera" style={{ filter, transform: 'scaleX(-1)' }} />
      {cameraState !== 'ready' && <span>{starting ? 'Menunggu gambar kamera…' : <>PHOTOBOX<br />✦ KARNAVAL KITA ✦</>}</span>}
      {count > 0 && <b aria-live="assertive">{count}</b>}
    </div>
    <div className="kk-row">
      <label className="kk-label">Efek<select value={filter} disabled={busy || starting} onChange={(e) => setFilter(e.target.value)}>
        <option value="none">Original</option><option value="grayscale(1)">Hitam putih</option>
        <option value="sepia(.65)">Vintage</option><option value="saturate(1.4)">Ceria</option>
      </select></label>
      <label className="kk-label">Warna bingkai<input type="color" value={color} disabled={busy || starting} onChange={(e) => { setColor(e.target.value); void applyFrame(frame, e.target.value); }} /></label>
    </div>
    <div className="kk-frame-options" role="group" aria-label="Desain bingkai">
      {([['carnival', 'Karnaval'], ['ticket', 'Tiket'], ['classic', 'Klasik']] as const).map(([id, label]) =>
        <button key={id} type="button" className={`kk-frame-option ${id}`} aria-pressed={frame === id}
          disabled={busy || starting} onClick={() => { setFrame(id); void applyFrame(id); }}>
          <span aria-hidden="true">{id === 'carnival' ? '✦ ▾ ✦' : id === 'ticket' ? '• • •' : '♡'}<i /><i /><i /></span>
          {label}
        </button>)}
    </div>
    <div className="kk-row">
      {cameraState === 'ready' ? <>
        <button type="button" className="kk-button" disabled={busy} onClick={shoot}>{busy ? 'Siap, senyum…' : 'Ambil 3 foto'}</button>
        <button type="button" className="kk-button secondary" disabled={busy} onClick={camera}>Mulai ulang kamera</button>
      </> : <button type="button" className="kk-button" disabled={starting || busy} onClick={camera}>
        {starting ? 'Membuka kamera…' : cameraState === 'error' ? 'Coba lagi' : 'Aktifkan kamera'}
      </button>}
      {starting && <button type="button" className="kk-button secondary" onClick={stopCamera}>Batalkan</button>}
      <label className="kk-button secondary" aria-disabled={busy || starting}>Pilih foto
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || starting}
          onChange={(e) => { void upload(e.target.files); e.target.value = ''; }} hidden />
      </label>
    </div>
    {error && <p role="alert">{error}</p>}
    {result && !busy && <>
      <img className="kk-photo-strip" src={result} alt="Hasil photobox tiga pose" />
      <div className="kk-row"><a className="kk-button" href={result} download="kenangan-karnaval.png">Unduh foto</a>
        <button type="button" className="kk-button secondary" disabled={busy || starting} onClick={() => void applyFrame()}>Terapkan bingkai</button>
      </div>
    </>}
    <small>Foto diproses di perangkatmu dan tidak diunggah.</small>
  </div>;
}
