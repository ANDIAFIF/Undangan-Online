/** Stop every track, including streams returned after the dialog was closed. */
export function stopCameraStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

const aborted = () => new DOMException('Camera request cancelled', 'AbortError');

function requestStream(
  devices: Pick<MediaDevices, 'getUserMedia'>,
  constraints: MediaStreamConstraints,
  signal: AbortSignal,
): Promise<MediaStream> {
  if (signal.aborted) return Promise.reject(aborted());
  return new Promise((resolve, reject) => {
    let settled = false;
    const cancel = () => { settled = true; reject(aborted()); };
    signal.addEventListener('abort', cancel, { once: true });
    // Native permission prompts cannot be cancelled. Dispose of a late result.
    devices.getUserMedia(constraints).then((stream) => {
      signal.removeEventListener('abort', cancel);
      if (settled || signal.aborted) { stopCameraStream(stream); return; }
      settled = true;
      resolve(stream);
    }, (error) => {
      signal.removeEventListener('abort', cancel);
      if (!settled) { settled = true; reject(error); }
    });
  });
}

export async function acquireCamera(
  devices: Pick<MediaDevices, 'getUserMedia'>,
  signal: AbortSignal,
  facingMode: 'user' | 'environment' = 'user',
) {
  try {
    return await requestStream(devices, {
      audio: false,
      video: { facingMode: facingMode === 'user' ? { ideal: 'user' } : { exact: 'environment' }, width: { ideal: 720 }, height: { ideal: 960 } },
    }, signal);
  } catch (error) {
    // Some cameras cannot negotiate the preferred portrait resolution.
    if (facingMode === 'user' && !signal.aborted && (error as DOMException)?.name === 'OverconstrainedError') {
      return requestStream(devices, { audio: false, video: true }, signal);
    }
    throw error;
  }
}

export function cameraHasFrame(video: HTMLVideoElement) {
  return video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
}

export function startCameraPreview(
  video: HTMLVideoElement,
  stream: MediaStream,
  signal: AbortSignal,
  timeoutMs = 12000,
): Promise<void> {
  if (signal.aborted) return Promise.reject(aborted());
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.srcObject = stream;

  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (error?: unknown) => {
      if (done) return;
      done = true;
      clearInterval(poll);
      clearTimeout(timeout);
      signal.removeEventListener('abort', cancel);
      video.removeEventListener('loadeddata', check);
      video.removeEventListener('playing', check);
      video.removeEventListener('resize', check);
      error ? reject(error) : resolve();
    };
    const cancel = () => finish(aborted());
    const check = () => {
      if (signal.aborted) return cancel();
      if (cameraHasFrame(video) && !video.paused) finish();
    };
    const poll = setInterval(check, 100);
    const timeout = setTimeout(() => finish(new DOMException('No camera frames', 'TimeoutError')), timeoutMs);
    signal.addEventListener('abort', cancel, { once: true });
    video.addEventListener('loadeddata', check);
    video.addEventListener('playing', check);
    video.addEventListener('resize', check);
    try { void video.play().then(check, finish); } catch (error) { finish(error); }
  });
}

export function cameraErrorMessage(error: unknown) {
  switch ((error as { name?: string })?.name) {
    case 'NotAllowedError': case 'PermissionDeniedError':
      return 'Browser belum mengizinkan kamera. Periksa izin kamera untuk alamat ini dan izin kamera browser di pengaturan perangkat, lalu coba lagi.';
    case 'NotFoundError': case 'DevicesNotFoundError':
      return 'Kamera tidak ditemukan. Sambungkan atau aktifkan kamera, lalu coba lagi.';
    case 'NotReadableError': case 'TrackStartError':
      return 'Kamera belum bisa dibaca. Tutup aplikasi atau tab lain yang sedang memakai kamera, lalu coba lagi.';
    case 'TimeoutError':
      return 'Izin sudah diberikan, tetapi gambar kamera belum masuk. Coba mulai ulang kamera, atau buka tautan ini langsung di Safari/Chrome.';
    case 'OverconstrainedError':
      return 'Kamera tidak mendukung pengaturan video ini. Coba kamera atau browser lain.';
    case 'SecurityError':
      return 'Akses kamera dibatasi browser. Buka undangan langsung di Safari/Chrome melalui HTTPS atau localhost.';
    default:
      return 'Kamera belum bisa dimulai. Coba mulai ulang kamera atau pilih foto dari perangkat.';
  }
}
