/**
 * Phase D acceptance check — SPEC.md §7, §11 D and §13, driven in a real browser.
 *
 * `npm run verify:explode` proves the explode maths returns to the exact original
 * transforms. This proves the rest of Phase D actually works when a person uses it:
 * tap-select, hover, isolate, systems toggles, search, the explode slider, cutaway,
 * the view cube and the labels — at both iPad Pro orientations (SPEC.md §1.6).
 *
 * It also closes the round trip visually. The frame rendered at 0 % after a full
 * 0 → 100 → 0 drag is compared **byte for byte** against the frame before it. Note
 * the clip: it covers the 3D viewport between the header and the explode control,
 * because the slider keeps a focus ring after being dragged and that ring is a DOM
 * control, not the model.
 *
 * The WebGL context is created without `preserveDrawingBuffer`, so reading the
 * canvas back with `toDataURL` returns a blank image. Every pixel measurement here
 * therefore goes through a compositor screenshot, which is the real rendered frame.
 *
 * This is not wired into package.json: it needs a Playwright install and a served
 * build, neither of which belongs in the application's dependency graph.
 *
 *   npm run build
 *   # serve dist/ under the base path from vite.config.ts, e.g.
 *   mkdir -p /tmp/site && cp -r dist /tmp/site/svp-atlas
 *   npx http-server /tmp/site -p 4173 --silent &
 *   node scripts/verify-interaction.mjs ./shots
 *
 * Overridable by environment:
 *   SVP_URL         page to open      (default http://127.0.0.1:4173/svp-atlas/)
 *   SVP_PLAYWRIGHT  playwright entry  (default the resolvable "playwright" package)
 *   SVP_CHROMIUM    browser binary    (default Playwright's own download)
 */

const { chromium } = await import(process.env.SVP_PLAYWRIGHT ?? 'playwright');
import { createHash } from 'node:crypto';

const SHOTS = process.argv[2] ?? './shots';
const URL = process.env.SVP_URL ?? 'http://127.0.0.1:4173/svp-atlas/';
const results = [];
const ok = (n, d = '') => results.push(['PASS', n, d]);
const bad = (n, d = '') => results.push(['FAIL', n, d]);

const browser = await chromium.launch({
  ...(process.env.SVP_CHROMIUM ? { executablePath: process.env.SVP_CHROMIUM } : {}),
  // Software WebGL, so the check runs on a machine with no GPU.
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
});

/**
 * The WebGL context is created without preserveDrawingBuffer, so reading the
 * canvas back with toDataURL yields a blank image. The compositor screenshot is
 * the real rendered frame, so every pixel assertion here goes through it.
 */
const shoot = (page, clip) => page.screenshot(clip ? { clip } : {});
const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);

// Decode a screenshot back into pixel statistics, using the page's own 2D canvas.
async function stats(page, clip) {
  const b64 = (await shoot(page, clip)).toString('base64');
  return page.evaluate(async (data) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + data;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    let lit = 0;
    const distinct = new Set();
    const pixels = d.length / 4;
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
      sum += l;
      // A lit surface of the machine, as opposed to background or a faded ghost.
      if (l > 70) lit += 1;
      distinct.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`);
    }
    return { mean: sum / pixels, lit: lit / pixels, distinct: distinct.size };
  }, b64);
}

async function session(width, height, label, body) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  // The Google Fonts stylesheet is unreachable from this sandbox; that is the
  // network, not the application, so it is excluded from the error assertion.
  const external = (t) => /fonts\.(googleapis|gstatic)\.com|ERR_CONNECTION_RESET|ERR_NAME_NOT_RESOLVED|favicon/.test(t);
  page.on('console', (m) => { if (m.type() === 'error' && !external(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => { if (!external(String(e))) errors.push(String(e)); });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas');
  await page.waitForTimeout(2500);
  await body(page, label);
  if (errors.length === 0) ok(`${label}: no console or page errors`);
  else bad(`${label}: console errors`, errors.slice(0, 3).join(' | '));
  await context.close();
}

const viewportClip = (page) => page.evaluate(() => {
  const header = document.querySelector('header').getBoundingClientRect();
  const explode = document.querySelector('section[aria-label="Explode assembly"]').getBoundingClientRect();
  return { x: 0, y: Math.ceil(header.bottom), width: window.innerWidth, height: Math.floor(explode.top - header.bottom) - 4 };
});

await session(1024, 1366, 'portrait 1024×1366', async (page, label) => {
  const clip = await viewportClip(page);
  await page.screenshot({ path: `${SHOTS}/01-portrait-boot.png` });
  const boot = await stats(page, clip);
  if (boot.distinct > 20) ok(`${label}: model renders`, `${boot.distinct} distinct colours, mean luminance ${boot.mean.toFixed(1)}`);
  else bad(`${label}: model renders`, JSON.stringify(boot));

  if (/91 modeled pieces/.test(await page.textContent('header'))) ok('header reports 91 modeled pieces');
  else bad('header reports 91 modeled pieces');

  const systems = (await page.textContent('section[aria-label="Systems"]')).replace(/\s+/g, ' ');
  if (/91 visible/.test(systems)) ok('systems panel reads "91 visible"', systems.slice(0, 90));
  else bad('systems panel reads "91 visible"', systems.slice(0, 160));

  const small = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('button, input[type="range"], input[type="search"]')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.height < 43.5 || r.width < 43.5) out.push({ l: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 32), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
    }
    return out;
  });
  if (small.length === 0) ok('every control clears the 44 px hit target (SPEC §1.6)');
  else bad('44 px hit targets', JSON.stringify(small));

  // ---- search
  await page.fill('input[type="search"]', '54003');
  await page.waitForTimeout(350);
  const hits = await page.$$eval('.z-40 li button', (ns) => ns.map((n) => n.textContent.replace(/\s+/g, ' ').trim()));
  if (hits.length === 1 && /Poppet/.test(hits[0])) ok('search "54003" finds exactly the Poppet', hits.join(' / '));
  else bad('search "54003" finds the Poppet', JSON.stringify(hits));
  await page.screenshot({ path: `${SHOTS}/02-search-54003.png` });

  const beforeFrame = await shoot(page, clip);
  await page.click('.z-40 li button');
  await page.waitForTimeout(1400);
  const afterFrame = await shoot(page, clip);
  const card = (await page.textContent('section[aria-label="Component detail"]').catch(() => '')).replace(/\s+/g, ' ');
  if (/Poppet/.test(card) && /54003/.test(card) && /Piston Assembly/.test(card)) ok('info card opens with name, id, OEM item and system', card.slice(0, 110));
  else bad('info card content', card.slice(0, 200));
  if (hash(beforeFrame) !== hash(afterFrame)) ok('selecting a search result re-frames the camera');
  else bad('selecting a search result re-frames the camera', 'frame unchanged');
  await page.screenshot({ path: `${SHOTS}/03-selected-poppet.png` });

  // ---- isolate
  await page.click('button[aria-label="Reset camera"]');
  await page.waitForTimeout(1300);
  const beforeIso = await stats(page, clip);
  await page.click('text=Isolate part');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${SHOTS}/04-isolate-poppet.png` });
  if (await page.isVisible('text=Exit isolation')) ok('isolate engages and offers an exit');
  else bad('isolate engages and offers an exit');
  // Put the camera back on the whole assembly while isolation stays on, so the
  // fade is measured against the identical view rather than against a close-up.
  await page.click('button[aria-label="Reset camera"]');
  await page.waitForTimeout(1400);
  const afterIso = await stats(page, clip);
  await page.screenshot({ path: `${SHOTS}/04b-isolate-whole-view.png` });
  // Mean luminance over the whole frame barely moves — the frame is mostly
  // background either way. What collapses is the share of *lit* pixels: the
  // machine's own surfaces, which isolate takes to 0.05 opacity.
  // Most of the lit surface must go, but not all of it: the isolated part itself
  // stays at full opacity, which is the whole point.
  if (afterIso.lit < beforeIso.lit * 0.5 && afterIso.lit > 0) {
    ok('isolate drops every other part to 0.05 opacity', `same camera, lit pixels ${(beforeIso.lit * 100).toFixed(1)} % → ${(afterIso.lit * 100).toFixed(2)} %`);
  } else {
    bad('isolate fade', `lit pixels ${(beforeIso.lit * 100).toFixed(1)} % → ${(afterIso.lit * 100).toFixed(2)} %`);
  }
  await page.click('text=Exit isolation');
  await page.waitForTimeout(800);
  await page.click('button[aria-label="Reset camera"]');
  await page.waitForTimeout(1200);

  // ---- explode round trip, driven through the real slider
  const slider = 'input[type="range"]';
  const pct = () => page.textContent('section[aria-label="Explode assembly"] span.tabular-nums');
  const assembledBefore = await shoot(page, clip);
  await page.fill(slider, '100'); await page.dispatchEvent(slider, 'input');
  await page.waitForTimeout(1200);
  const at100Text = (await pct()).replace(/\s+/g, ' ').trim();
  const at100 = await shoot(page, clip);
  await page.screenshot({ path: `${SHOTS}/05-explode-100.png` });
  for (const v of [93, 81, 66, 52, 44, 37, 25, 18, 9, 3, 0]) {
    await page.fill(slider, String(v)); await page.dispatchEvent(slider, 'input');
    await page.waitForTimeout(110);
  }
  await page.waitForTimeout(1400);
  const at0Text = (await pct()).replace(/\s+/g, ' ').trim();
  const assembledAfter = await shoot(page, clip);
  await page.screenshot({ path: `${SHOTS}/06-explode-back-to-0.png` });

  if (/100 %/.test(at100Text)) ok('slider reads "100 %" at full explode', at100Text.slice(0, 60));
  else bad('slider percentage at 100', at100Text.slice(0, 80));
  if (/\b0 %/.test(at0Text)) ok('slider reads "0 %" on return', at0Text.slice(0, 60));
  else bad('slider percentage back at 0', at0Text.slice(0, 80));
  if (hash(assembledBefore) !== hash(at100)) ok('the assembly visibly separates at 100 %');
  else bad('the assembly visibly separates at 100 %', 'frame unchanged');
  if (hash(assembledBefore) === hash(assembledAfter)) {
    ok('rendered frame after 0→100→0 is byte-identical to the assembled frame', `sha256/16 ${hash(assembledAfter)}`);
  } else {
    bad('explode round trip', `${hash(assembledBefore)} vs ${hash(assembledAfter)}`);
  }

  // ---- labels
  await page.fill(slider, '4'); await page.dispatchEvent(slider, 'input'); await page.waitForTimeout(500);
  const at4 = await page.evaluate(() => document.querySelectorAll('div[aria-hidden="true"].absolute.inset-0 button').length);
  await page.fill(slider, '35'); await page.dispatchEvent(slider, 'input'); await page.waitForTimeout(900);
  const at35 = await page.evaluate(() => {
    const ns = [...document.querySelectorAll('div[aria-hidden="true"].absolute.inset-0 button')];
    const boxes = ns.filter((n) => getComputedStyle(n).visibility === 'visible').map((n) => n.getBoundingClientRect());
    let overlaps = 0, offscreen = 0;
    for (let i = 0; i < boxes.length; i += 1) {
      if (boxes[i].right > window.innerWidth + 1 || boxes[i].left < -1) offscreen += 1;
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i], b = boxes[j];
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlaps += 1;
      }
    }
    return { total: ns.length, visible: boxes.length, overlaps, offscreen };
  });
  await page.screenshot({ path: `${SHOTS}/07-labels-35pct.png` });
  if (at4 === 0 && at35.visible > 0) ok('labels appear only above 5 % explode', `0 chips at 4 %, ${at35.visible}/${at35.total} shown at 35 %`);
  else bad('label 5 % threshold', `at4=${at4}, at35=${JSON.stringify(at35)}`);
  if (at35.overlaps === 0) ok('no two visible labels overlap', `${at35.visible} chips placed`);
  else bad('label declutter', `${at35.overlaps} overlapping pairs`);
  if (at35.offscreen === 0) ok('no label runs off the edge of the viewport');
  else bad('label overflow', `${at35.offscreen} chips off-screen`);
  await page.fill(slider, '0'); await page.dispatchEvent(slider, 'input'); await page.waitForTimeout(600);

  // ---- systems
  await page.click('section[aria-label="Systems"] >> text=Piston Assembly');
  await page.waitForTimeout(600);
  const hiddenText = (await page.textContent('section[aria-label="Systems"]')).replace(/\s+/g, ' ');
  await page.screenshot({ path: `${SHOTS}/08-piston-hidden.png` });
  if (/76 visible/.test(hiddenText)) ok('hiding Piston Assembly takes the count 91 → 76');
  else bad('systems toggle count', hiddenText.slice(0, 120));
  await page.click('section[aria-label="Systems"] >> text=Piston Assembly');
  await page.waitForTimeout(500);

  const full = await stats(page, clip);
  await page.click('text=Hide all');
  await page.waitForTimeout(900);
  const empty = await stats(page, clip);
  await page.screenshot({ path: `${SHOTS}/09-hide-all.png` });
  if (/0 visible/.test(await page.textContent('section[aria-label="Systems"]')) && empty.distinct < full.distinct / 2) {
    ok('Hide all empties the viewport', `${full.distinct} → ${empty.distinct} distinct colours`);
  } else bad('Hide all', `${full.distinct} → ${empty.distinct}`);
  await page.click('text=Show all');
  await page.waitForTimeout(900);

  // ---- cutaway
  const beforeCut = await shoot(page, clip);
  await page.click('button[aria-label^="Cutaway"]');
  await page.waitForTimeout(1200);
  const afterCut = await shoot(page, clip);
  await page.screenshot({ path: `${SHOTS}/10-cutaway.png` });
  if (hash(beforeCut) !== hash(afterCut)) ok('cutaway changes the rendered frame');
  else bad('cutaway changes the rendered frame', 'frame unchanged');
  await page.click('button[aria-label^="Cutaway"]');
  await page.waitForTimeout(700);

  // ---- view cube
  let prev = hash(await shoot(page, clip));
  for (const [name, sel] of [['front', 'button[aria-label="Front elevation"]'], ['side', 'button[aria-label^="Side elevation"]'], ['top', 'button[aria-label="Top view"]']]) {
    await page.click(sel);
    await page.waitForTimeout(1200);
    const now = hash(await shoot(page, clip));
    if (now !== prev) ok(`view cube: ${name} moves the camera`);
    else bad(`view cube: ${name} moves the camera`);
    prev = now;
    await page.screenshot({ path: `${SHOTS}/11-view-${name}.png` });
  }
  await page.click('button[aria-label="Three-quarter view"]');
  await page.waitForTimeout(1000);

  // ---- theme
  const dark = await stats(page, clip);
  await page.click('button[aria-label^="Switch to light"]');
  await page.waitForTimeout(1000);
  const light = await stats(page, clip);
  await page.screenshot({ path: `${SHOTS}/12-light-theme.png` });
  const attr = await page.getAttribute('html', 'data-theme');
  if (attr === 'light' && light.mean > dark.mean + 25) ok('light setting lifts the whole surface', `mean luminance ${dark.mean.toFixed(1)} → ${light.mean.toFixed(1)}`);
  else bad('light setting', `data-theme=${attr}, mean ${dark.mean.toFixed(1)} → ${light.mean.toFixed(1)}`);
  await page.click('button[aria-label^="Switch to dark"]');
  await page.waitForTimeout(900);

  // ---- tap to select on the model itself
  await page.mouse.click(512, 760);
  await page.waitForTimeout(700);
  const tapped = (await page.textContent('section[aria-label="Component detail"]').catch(() => '')).replace(/\s+/g, ' ');
  if (tapped.length > 0) ok('tapping the model opens its info card', tapped.slice(0, 70));
  else bad('tap to select', 'no card opened');
  await page.screenshot({ path: `${SHOTS}/13-tap-select.png` });

  // tapping empty space clears it again
  await page.mouse.click(700, 200);
  await page.waitForTimeout(500);
  if ((await page.$('section[aria-label="Component detail"]')) === null) ok('tapping empty space clears the selection');
  else bad('tapping empty space clears the selection');

  // ---- reset all
  await page.fill(slider, '60'); await page.dispatchEvent(slider, 'input');
  await page.click('section[aria-label="Systems"] >> text=Detection');
  await page.waitForTimeout(600);
  await page.click('button[aria-label="Reset everything"]');
  await page.waitForTimeout(1200);
  const reset = (await page.textContent('section[aria-label="Systems"]')).replace(/\s+/g, ' ');
  const resetPct = (await pct()).replace(/\s+/g, ' ').trim();
  if (/91 visible/.test(reset) && /\b0 %/.test(resetPct)) ok('reset everything restores 91 visible and 0 % explode');
  else bad('reset everything', `${reset.slice(0, 60)} | ${resetPct.slice(0, 40)}`);

  const stored = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie.length, idb: typeof indexedDB }));
  if (stored.local === 0 && stored.session === 0 && stored.cookie === 0) ok('no browser storage written (SPEC §1.2)', JSON.stringify(stored));
  else bad('browser storage', JSON.stringify(stored));
});

await session(1366, 1024, 'landscape 1366×1024', async (page, label) => {
  const clip = await viewportClip(page);
  await page.screenshot({ path: `${SHOTS}/14-landscape-boot.png` });
  const boot = await stats(page, clip);
  if (boot.distinct > 20) ok(`${label}: model renders`, `${boot.distinct} distinct colours`);
  else bad(`${label}: model renders`, JSON.stringify(boot));

  const overflow = await page.evaluate(() => ({
    x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  }));
  if (overflow.x <= 0 && overflow.y <= 0) ok(`${label}: no page overflow`);
  else bad(`${label}: page overflow`, JSON.stringify(overflow));

  const boxes = await page.evaluate(() => {
    const pick = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom) }; };
    return { systems: pick('section[aria-label="Systems"]'), explode: pick('section[aria-label="Explode assembly"]'), rail: pick('div[class*="inset-y-0"][class*="right-0"] > div') };
  });
  const clear = boxes.systems && boxes.explode && boxes.rail && boxes.systems.b < boxes.explode.t && boxes.explode.r < boxes.rail.l;
  if (clear) ok(`${label}: panels, slider and rail do not collide`);
  else bad(`${label}: panel collision`, JSON.stringify(boxes));

  // the round trip again, at the other orientation
  const slider = 'input[type="range"]';
  const before = await shoot(page, clip);
  await page.fill(slider, '100'); await page.dispatchEvent(slider, 'input');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/15-landscape-explode-100.png` });
  for (const v of [70, 45, 22, 7, 0]) { await page.fill(slider, String(v)); await page.dispatchEvent(slider, 'input'); await page.waitForTimeout(120); }
  await page.waitForTimeout(1300);
  const after = await shoot(page, clip);
  if (hash(before) === hash(after)) ok(`${label}: 0→100→0 returns a byte-identical frame`, `sha256/16 ${hash(after)}`);
  else bad(`${label}: explode round trip`, `${hash(before)} vs ${hash(after)}`);

  await page.click('button[aria-label^="Switch to light"]');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/16-landscape-light.png` });
});

await browser.close();

let failed = 0;
console.log('');
for (const [status, name, detail] of results) {
  if (status === 'FAIL') failed += 1;
  console.log(`  ${status === 'PASS' ? '✓' : '✗'} ${name}${detail ? `  —  ${detail}` : ''}`);
}
console.log(`\n${results.length - failed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
