'use client';

export default function Welcome({ name, playing, error, onPlay, onPause, onReplay, onContinue }: {
  name: string;
  playing: boolean;
  error: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  onContinue: () => void;
}) {
  return <div className="kk-letter">
    <p>Untuk {name}</p>
    <div className="kk-welcome-transcript">
      <p>Hai... kalau kamu lagi dengerin pesan ini... berarti kamu itu orang yang aku pengen banget hadir, di hari spesial kami.</p>
      <p>Makasih ya... udah jadi bagian dari cerita kami. Jadi... pokoknya kamu harus datang ya! Aku tunggu kamu di sana!</p>
    </div>
    <div className="kk-row">
      <button type="button" className="kk-button secondary" onClick={playing ? onPause : onPlay}>
        {playing ? 'Jeda sapaan' : 'Putar sapaan'}
      </button>
      <button type="button" className="kk-button secondary" onClick={onReplay}>Ulangi dari awal</button>
    </div>
    {error && <p role="status">Suara belum bisa diputar. Ketuk Putar sapaan untuk mencoba lagi.</p>}
    <p><button type="button" className="kk-button" onClick={onContinue}>Lanjut ke Wedding</button></p>
  </div>;
}
