import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  acquireCamera,
  cameraErrorMessage,
  cameraHasFrame,
  startCameraPreview,
} from './photobooth-camera';

function fakeStream() {
  let stopped = 0;
  const stream = {
    getTracks: () => [{ stop() { stopped++; } }],
  } as unknown as MediaStream;
  return { stream, stopped: () => stopped };
}

function fakeVideo() {
  const video = Object.assign(new EventTarget(), {
    muted: false,
    defaultMuted: false,
    autoplay: false,
    playsInline: false,
    paused: true,
    readyState: 0,
    videoWidth: 0,
    videoHeight: 0,
    srcObject: null as MediaStream | null,
    attributes: new Map<string, string>(),
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    },
    async play() { this.paused = false; },
  });
  return { fake: video, video: video as unknown as HTMLVideoElement };
}

test('camera acquisition falls back only for unsupported constraints', async () => {
  const value = fakeStream();
  const calls: MediaStreamConstraints[] = [];
  const devices = {
    async getUserMedia(constraints: MediaStreamConstraints) {
      calls.push(constraints);
      if (calls.length === 1) throw new DOMException('', 'OverconstrainedError');
      return value.stream;
    },
  };
  assert.equal(await acquireCamera(devices, new AbortController().signal), value.stream);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], { audio: false, video: true });
});

test('permission denial does not repeat permission requests', async () => {
  let calls = 0;
  const devices = {
    async getUserMedia() {
      calls++;
      throw new DOMException('', 'NotAllowedError');
    },
  };
  await assert.rejects(acquireCamera(devices, new AbortController().signal), {
    name: 'NotAllowedError',
  });
  assert.equal(calls, 1);
});

test('cancelled permission prompt stops a stream that arrives late', async () => {
  const value = fakeStream();
  let resolve!: (stream: MediaStream) => void;
  const devices = {
    getUserMedia: () => new Promise<MediaStream>((done) => { resolve = done; }),
  };
  const controller = new AbortController();
  const rejected = assert.rejects(acquireCamera(devices, controller.signal), {
    name: 'AbortError',
  });
  controller.abort();
  await rejected;
  resolve(value.stream);
  await Promise.resolve();
  assert.equal(value.stopped(), 1);
});

test('permission and play success do not mark a zero-size preview ready', async () => {
  const { fake, video } = fakeVideo();
  let ready = false;
  const preview = startCameraPreview(
    video, fakeStream().stream, new AbortController().signal,
  ).then(() => { ready = true; });
  await Promise.resolve();
  assert.equal(ready, false);
  assert.equal(cameraHasFrame(video), false);
  Object.assign(fake, { readyState: 2, videoWidth: 640, videoHeight: 480 });
  fake.dispatchEvent(new Event('loadeddata'));
  await preview;
  assert.equal(ready, true);
  assert.equal(fake.muted && fake.defaultMuted && fake.autoplay && fake.playsInline, true);
  assert.ok(fake.attributes.has('webkit-playsinline'));
});

test('preview without frames times out instead of enabling capture', async () => {
  const { video } = fakeVideo();
  await assert.rejects(
    startCameraPreview(video, fakeStream().stream, new AbortController().signal, 10),
    { name: 'TimeoutError' },
  );
});

test('blocked playback and closing a preview reject cleanly', async () => {
  const first = fakeVideo();
  first.fake.play = async () => { throw new DOMException('', 'NotAllowedError'); };
  await assert.rejects(
    startCameraPreview(first.video, fakeStream().stream, new AbortController().signal),
    { name: 'NotAllowedError' },
  );
  const second = fakeVideo();
  const controller = new AbortController();
  const rejected = assert.rejects(
    startCameraPreview(second.video, fakeStream().stream, controller.signal),
    { name: 'AbortError' },
  );
  controller.abort();
  await rejected;
});

test('errors distinguish permission, busy camera, and missing frames', () => {
  assert.match(cameraErrorMessage({ name: 'NotAllowedError' }), /mengizinkan kamera/);
  assert.match(cameraErrorMessage({ name: 'NotReadableError' }), /aplikasi atau tab lain/);
  assert.match(cameraErrorMessage({ name: 'TimeoutError' }), /gambar kamera belum masuk/);
});
