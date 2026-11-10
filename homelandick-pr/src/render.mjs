// Renders src/index.html frame by frame with headless Chromium and encodes an MP4.
// usage: node src/render.mjs            -> full video
//        node src/render.mjs still 5 12 -> stills at t=5s, 12s (out/still_*.png)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = 'file://' + path.join(root, 'src/index.html');
const FPS = 30, WORKERS = 4;
const out = path.join(root, 'out'), frames = path.join(out, 'frames');

const browser = await chromium.launch();
async function open() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(url);
  await page.evaluate(async () => { render(30); await document.fonts.ready; });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

if (process.argv[2] === 'still') {
  const page = await open();
  for (const t of process.argv.slice(3)) {
    await page.evaluate(t => render(t), +t);
    await page.screenshot({ path: path.join(out, `still_${String(t).padStart(4, '0')}.png`) });
  }
  await browser.close();
  process.exit(0);
}

rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });
const total = await (await open()).evaluate(() => TOTAL);
const N = Math.round(total * FPS);
let next = 0, done = 0;
await Promise.all(Array.from({ length: WORKERS }, async () => {
  const page = await open();
  while (next < N) {
    const i = next++;
    await page.evaluate(t => render(t), i / FPS);
    await page.screenshot({ path: path.join(frames, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 97 });
    if (++done % 300 === 0) console.log(`${done}/${N}`);
  }
}));
await browser.close();

const audio = path.join(out, 'music.wav');
const args = ['-y', '-framerate', String(FPS), '-i', path.join(frames, 'f%05d.jpg')];
if (existsSync(audio)) args.push('-i', audio, '-c:a', 'aac', '-b:a', '256k', '-shortest');
args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  path.join(out, 'homelandick_pr.mp4'));
await new Promise((res, rej) => spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] })
  .on('exit', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
console.log('done: out/homelandick_pr.mp4');
