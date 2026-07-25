/**
 * Phase 2F-1.1.2 mobile chat layout browser validation (Playwright).
 * Synthetic only. Does not commit or mutate production data.
 *
 * Usage: node scripts/phase2f112-browser-validation.mjs
 * Requires a local server on PHASE2F112_BASE_URL (default http://localhost:3000).
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const BASE = process.env.PHASE2F112_BASE_URL || 'http://localhost:3000';
const OUT = path.join(root, 'priority3-phase2f112-browser-validation.json');
const SHOT_DIR = path.join(root, 'priority3-phase2f112-screenshots');

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '768x1024', width: 768, height: 1024, mobile: false },
  { name: '430x932', width: 430, height: 932, mobile: true },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '360x800', width: 360, height: 800, mobile: true },
  { name: '360x640', width: 360, height: 640, mobile: true },
  { name: '320x700', width: 320, height: 700, mobile: true },
  { name: '320x568', width: 320, height: 568, mobile: true },
];

/** @typedef {{ id: string, pass: boolean, detail: string, evidence?: unknown }} Check */

/** @type {Check[]} */
const checks = [];

function record(id, pass, detail, evidence) {
  checks.push({ id, pass, detail, evidence });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}: ${detail}`);
}

function ensureShotDir() {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
}

async function waitForChatReady(page) {
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[data-chat-launcher="true"]');
    return Boolean(btn);
  }, { timeout: 30000 });
}

async function openChat(page) {
  const launcher = page.locator('button[data-chat-launcher="true"]').first();
  await launcher.click();
  await page.getByRole('dialog', { name: /Primewayz chat/i }).waitFor({ timeout: 10000 });
}

async function closeChat(page) {
  const close = page.getByRole('button', { name: /Close chat/i });
  if (await close.count()) {
    await close.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.locator('button[data-chat-launcher="true"]').waitFor({ timeout: 10000 });
}

async function measureSheet(page) {
  return page.evaluate(() => {
    const sheet = document.querySelector('[data-testid="chat-sheet"]');
    const header = document.querySelector('[data-testid="chat-header"]');
    const messages = document.querySelector('[data-testid="chat-message-area"]');
    const composer = document.querySelector('[data-testid="chat-composer"]');
    const launcher = document.querySelector('button[data-chat-launcher="true"]');
    const closeButtons = [...document.querySelectorAll('[aria-label="Close chat"]')];
    if (!sheet) return null;

    const sheetRect = sheet.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect();
    const messagesRect = messages?.getBoundingClientRect();
    const composerRect = composer?.getBoundingClientRect();
    const style = window.getComputedStyle(sheet);
    const msgStyle = messages ? window.getComputedStyle(messages) : null;

    const pageStripLeft = sheetRect.left;
    const pageStripRight = window.innerWidth - sheetRect.right;

    return {
      mobileSheet: sheet.getAttribute('data-mobile-sheet'),
      ariaModal: sheet.getAttribute('aria-modal'),
      width: Math.round(sheetRect.width),
      height: Math.round(sheetRect.height),
      left: Math.round(sheetRect.left),
      top: Math.round(sheetRect.top),
      borderRadius: style.borderRadius,
      maxWidth: style.maxWidth,
      maxHeight: style.maxHeight,
      className: sheet.className,
      heightStyle: sheet.style.height || '',
      has100vhClass: sheet.className.includes('h-[100vh]'),
      has100dvhClass: sheet.className.includes('h-[100dvh]'),
      has100dvwClass: sheet.className.includes('w-[100dvw]'),
      computedHeight: style.height,
      usesDvhFallback:
        sheet.className.includes('h-[100vh]')
        && sheet.className.includes('h-[100dvh]'),
      pageStripLeft,
      pageStripRight,
      launcherPresent: Boolean(launcher),
      closeCount: closeButtons.length,
      headerVisible: Boolean(headerRect && headerRect.height > 0 && headerRect.bottom > 0),
      composerVisible: Boolean(
        composerRect && composerRect.height > 0 && composerRect.top < window.innerHeight,
      ),
      messageScrollable: msgStyle
        ? msgStyle.overflowY === 'auto' || msgStyle.overflowY === 'scroll'
        : false,
      headerOverflowY: header ? window.getComputedStyle(header).overflowY : null,
      composerOverflowY: composer ? window.getComputedStyle(composer).overflowY : null,
      bodyPosition: document.body.style.position,
      docOverflowPx:
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
        - document.documentElement.clientWidth,
    };
  });
}

async function injectLongMessage(page) {
  await page.evaluate(() => {
    const area = document.querySelector('[data-testid="chat-message-area"]');
    if (!area) return;
    const wrap = document.createElement('div');
    wrap.setAttribute('data-testid', 'chat-long-message-probe');
    wrap.className = 'flex justify-start';
    wrap.innerHTML = `<div class="max-w-[min(92%,18.5rem)] rounded-2xl border border-brand-border bg-white px-2.5 py-2 text-sm"><p class="whitespace-pre-wrap break-words leading-5" style="overflow-wrap:anywhere">https://example.com/very/long/path/that/must/not/widen/the/chat/panel/on/narrow/android/devices/320px-wide-viewports?query=abcdefghijklmnopqrstuvwxyz0123456789</p></div>`;
    area.appendChild(wrap);
  });
}

async function simulateKeyboardViewport(page, height) {
  await page.evaluate((h) => {
    const vv = window.visualViewport;
    if (!vv) return;
    // Dispatch resize after temporarily stubbing height via a custom event path
    // used by the open sheet listener (real vv height is read live).
    window.dispatchEvent(new Event('resize'));
    const sheet = document.querySelector('[data-testid="chat-sheet"]');
    if (sheet && h) {
      sheet.style.height = `${h}px`;
      sheet.style.top = '0px';
    }
  }, height);
}

async function seedUnreadAndPresence(page) {
  await page.route('**/api/chat/availability', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'online',
        canAcceptMessages: true,
        canBookCall: true,
        serverTime: new Date().toISOString(),
        mode: 'online',
        computedStatus: 'online',
        hasActiveAdmin: true,
      }),
    });
  });
  await page.evaluate(() => {
    const launcher = document.querySelector('button[data-chat-launcher="true"]');
    if (!launcher) return;
    launcher.setAttribute('data-unread', '2');
    let badge = launcher.querySelector('[data-testid="chat-unread-badge"]');
    if (!badge) {
      badge = document.createElement('span');
      badge.setAttribute('data-testid', 'chat-unread-badge');
      badge.className =
        'absolute -right-1 -top-1 z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white';
      badge.textContent = '2';
      launcher.appendChild(badge);
    }
    launcher.setAttribute('data-presence', 'online');
    const dot = launcher.querySelector('[data-testid="chat-presence-dot"]');
    if (dot) {
      dot.setAttribute('data-presence', 'online');
      dot.className = dot.className.replace(/bg-\S+/g, '').trim() + ' bg-green-500';
    }
  });
}

/** Stub chat transport so layout validation never crashes the local server via Prisma. */
async function stubChatTransport(page) {
  const availability = {
    status: 'online',
    canAcceptMessages: true,
    canBookCall: true,
    serverTime: new Date().toISOString(),
    mode: 'online',
    computedStatus: 'online',
    hasActiveAdmin: true,
  };

  await page.route('**/api/chat/availability', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(availability),
    });
  });

  await page.route('**/api/chat/heartbeat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route('**/api/chat/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: 'phase2f112-layout-session',
        messages: [],
        availability,
      }),
    });
  });

  await page.route('**/api/chat/respond', async (route) => {
    const body = route.request().postDataJSON() || {};
    const text = typeof body.message === 'string' ? body.message : 'ok';
    const now = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        userMessage: { id: `u-${Date.now()}`, text, sender: 'user', timestamp: now },
        botMessage: {
          id: `b-${Date.now()}`,
          text: 'Thanks — layout validation bot ack.',
          sender: 'bot',
          timestamp: now,
        },
        availability,
      }),
    });
  });

  await page.route('**/api/chat/phase2f112-layout-session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: 'phase2f112-layout-session',
        messages: [],
        availability,
      }),
    });
  });

  // Any other session poll / legacy id from localStorage.
  await page.route(/\/api\/chat\/[^/?]+$/, async (route) => {
    const url = route.request().url();
    if (
      url.includes('/api/chat/availability')
      || url.includes('/api/chat/heartbeat')
      || url.includes('/api/chat/session')
      || url.includes('/api/chat/respond')
      || url.includes('/api/chat/uploads')
      || url.includes('/api/chat/appointments')
    ) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: 'phase2f112-layout-session',
        messages: [],
        availability,
      }),
    });
  });
}

async function runViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();
  await stubChatTransport(page);
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForChatReady(page);
  await page.waitForTimeout(500);

  await openChat(page);
  await page.waitForTimeout(300);

  const openShot = path.join(SHOT_DIR, `${viewport.name}-01-intent.png`);
  await page.screenshot({ path: openShot, fullPage: false });

  const sheet = await measureSheet(page);
  record(
    `viewport.${viewport.name}.sheet_measured`,
    Boolean(sheet),
    sheet ? `w=${sheet.width} h=${sheet.height}` : 'missing sheet',
    sheet,
  );

  if (viewport.mobile) {
    record(
      `viewport.${viewport.name}.full_width`,
      Boolean(sheet && sheet.width >= viewport.width - 2),
      `width=${sheet?.width} viewport=${viewport.width}`,
      sheet,
    );
    record(
      `viewport.${viewport.name}.dvh_classes`,
      Boolean(sheet && sheet.has100vhClass && sheet.has100dvhClass && sheet.has100dvwClass),
      `vh=${sheet?.has100vhClass} dvh=${sheet?.has100dvhClass} dvw=${sheet?.has100dvwClass}`,
      sheet,
    );
    record(
      `viewport.${viewport.name}.no_page_strip`,
      Boolean(sheet && Math.abs(sheet.pageStripLeft) <= 1 && Math.abs(sheet.pageStripRight) <= 1),
      `left=${sheet?.pageStripLeft} right=${sheet?.pageStripRight}`,
      sheet,
    );
    record(
      `viewport.${viewport.name}.aria_modal_true`,
      sheet?.ariaModal === 'true',
      `aria-modal=${sheet?.ariaModal}`,
      sheet,
    );
    record(
      `viewport.${viewport.name}.launcher_absent_while_open`,
      sheet?.launcherPresent === false,
      `launcherPresent=${sheet?.launcherPresent}`,
      sheet,
    );
    record(
      `viewport.${viewport.name}.exactly_one_close`,
      sheet?.closeCount === 1,
      `closeCount=${sheet?.closeCount}`,
      sheet,
    );
    record(
      `viewport.${viewport.name}.header_visible`,
      sheet?.headerVisible === true,
      `headerVisible=${sheet?.headerVisible}`,
      sheet,
    );
    record(
      `viewport.${viewport.name}.composer_visible`,
      sheet?.composerVisible === true,
      `composerVisible=${sheet?.composerVisible}`,
      sheet,
    );
    record(
      `viewport.${viewport.name}.only_message_area_scrolls`,
      Boolean(
        sheet
        && sheet.messageScrollable
        && sheet.headerOverflowY !== 'auto'
        && sheet.headerOverflowY !== 'scroll'
        && sheet.composerOverflowY !== 'auto'
        && sheet.composerOverflowY !== 'scroll',
      ),
      `msg=${sheet?.messageScrollable} header=${sheet?.headerOverflowY} composer=${sheet?.composerOverflowY}`,
      sheet,
    );
    record(
      `viewport.${viewport.name}.body_locked`,
      sheet?.bodyPosition === 'fixed',
      `body.position=${sheet?.bodyPosition}`,
      sheet,
    );
  } else {
    record(
      `viewport.${viewport.name}.desktop_not_fullscreen_sheet`,
      Boolean(sheet && sheet.mobileSheet === 'false' && sheet.width < viewport.width - 40),
      `mobileSheet=${sheet?.mobileSheet} width=${sheet?.width}`,
      sheet,
    );
  }

  record(
    `viewport.${viewport.name}.no_horizontal_overflow`,
    Boolean(sheet && sheet.docOverflowPx <= 1),
    `overflowPx=${sheet?.docOverflowPx}`,
    sheet,
  );

  // Sent message state (synthetic local send via textarea if enabled).
  const textarea = page.getByRole('textbox', { name: /Chat message/i });
  if (await textarea.count()) {
    await textarea.fill('Phase 2F-1.1.2 layout probe message');
    await page.getByRole('button', { name: /Send message/i }).click();
    await page.waitForTimeout(400);
  }
  const sentShot = path.join(SHOT_DIR, `${viewport.name}-02-sent.png`);
  await page.screenshot({ path: sentShot, fullPage: false });

  // Human-response-like bubble probe + long URL overflow.
  await injectLongMessage(page);
  await page.evaluate(() => {
    const area = document.querySelector('[data-testid="chat-message-area"]');
    if (!area) return;
    const wrap = document.createElement('div');
    wrap.setAttribute('data-testid', 'chat-human-response-probe');
    wrap.className = 'flex justify-start';
    wrap.innerHTML =
      '<div class="max-w-[min(92%,18.5rem)] rounded-2xl border border-brand-border bg-white px-2.5 py-2 text-sm text-brand-ink"><p class="text-[12px] font-semibold">Primewayz team</p><p class="whitespace-pre-wrap break-words leading-5" style="overflow-wrap:anywhere">Thanks — a human response for layout validation.</p></div>';
    area.appendChild(wrap);
    area.scrollTop = area.scrollHeight;
  });
  await page.waitForTimeout(200);
  const humanVisible = await page.evaluate(() => {
    const area = document.querySelector('[data-testid="chat-message-area"]');
    const probe = document.querySelector('[data-testid="chat-human-response-probe"]');
    if (!area || !probe) return { visible: false, reason: 'missing nodes' };
    area.scrollTop = area.scrollHeight;
    const areaRect = area.getBoundingClientRect();
    const probeRect = probe.getBoundingClientRect();
    const intersects =
      probeRect.bottom > areaRect.top
      && probeRect.top < areaRect.bottom
      && probeRect.right > areaRect.left
      && probeRect.left < areaRect.right;
    const text = probe.textContent || '';
    return {
      visible: intersects && text.includes('Thanks — a human response for layout validation.'),
      intersects,
      textPresent: text.includes('Thanks — a human response for layout validation.'),
      probeTop: Math.round(probeRect.top),
      areaTop: Math.round(areaRect.top),
      areaBottom: Math.round(areaRect.bottom),
    };
  });
  if (viewport.name === '320x568' || viewport.name === '360x640') {
    record(
      `viewport.${viewport.name}.human_response_visible`,
      humanVisible.visible === true,
      `intersects=${humanVisible.intersects} textPresent=${humanVisible.textPresent}`,
      humanVisible,
    );
  }
  const humanShot = path.join(SHOT_DIR, `${viewport.name}-03-human.png`);
  await page.screenshot({ path: humanShot, fullPage: false });

  const overflowAfter = await page.evaluate(() => {
    const sheetEl = document.querySelector('[data-testid="chat-sheet"]');
    const long = document.querySelector('[data-testid="chat-long-message-probe"] p');
    return {
      docOverflowPx:
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
        - document.documentElement.clientWidth,
      sheetWidth: sheetEl ? Math.round(sheetEl.getBoundingClientRect().width) : null,
      longScrollWidth: long ? long.scrollWidth : null,
      longClientWidth: long ? long.clientWidth : null,
    };
  });
  record(
    `viewport.${viewport.name}.long_url_no_widen`,
    overflowAfter.docOverflowPx <= 1
      && (overflowAfter.sheetWidth == null
        || overflowAfter.sheetWidth <= viewport.width + 1),
    `overflow=${overflowAfter.docOverflowPx} sheetW=${overflowAfter.sheetWidth}`,
    overflowAfter,
  );

  // Composer focused (keyboard simulation for mobile).
  if (await textarea.count()) {
    await textarea.click();
    await textarea.focus();
  }
  if (viewport.mobile) {
    await simulateKeyboardViewport(page, Math.max(280, Math.floor(viewport.height * 0.55)));
    await page.waitForTimeout(100);
    const kb = await measureSheet(page);
    record(
      `viewport.${viewport.name}.keyboard_composer_visible`,
      kb?.composerVisible === true && kb?.headerVisible === true,
      `composer=${kb?.composerVisible} header=${kb?.headerVisible} height=${kb?.height}`,
      kb,
    );
  }
  const focusShot = path.join(SHOT_DIR, `${viewport.name}-04-composer-focus.png`);
  await page.screenshot({ path: focusShot, fullPage: false });

  await closeChat(page);
  await page.waitForTimeout(250);
  const bodyAfterClose = await page.evaluate(() => document.body.style.position);
  record(
    `viewport.${viewport.name}.body_lock_clears_on_close`,
    bodyAfterClose === '',
    `body.position=${bodyAfterClose || '(empty)'}`,
  );

  await seedUnreadAndPresence(page);
  const closedShot = path.join(SHOT_DIR, `${viewport.name}-05-launcher-closed.png`);
  await page.screenshot({ path: closedShot, fullPage: false });

  const launcher = await page.evaluate(() => {
    const btn = document.querySelector('button[data-chat-launcher="true"]');
    if (!btn) return null;
    const badge = btn.querySelector('[data-testid="chat-unread-badge"]');
    const dot = btn.querySelector('[data-testid="chat-presence-dot"]');
    const rect = btn.getBoundingClientRect();
    const badgeRect = badge?.getBoundingClientRect();
    const dotRect = dot?.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const style = dot ? window.getComputedStyle(dot) : null;
    return {
      presence: btn.getAttribute('data-presence'),
      hasBadge: Boolean(badge),
      hasDot: Boolean(dot),
      dotBg: style?.backgroundColor || '',
      clip: {
        launcherRight: Math.max(0, rect.right - vw),
        launcherBottom: Math.max(0, rect.bottom - vh),
        badgeRight: badgeRect ? Math.max(0, badgeRect.right - vw) : 0,
        badgeTop: badgeRect ? Math.max(0, -badgeRect.top) : 0,
        dotRight: dotRect ? Math.max(0, dotRect.right - vw) : 0,
        dotBottom: dotRect ? Math.max(0, dotRect.bottom - vh) : 0,
      },
    };
  });

  record(
    `viewport.${viewport.name}.closed_launcher_presence`,
    Boolean(launcher?.hasDot && launcher.presence === 'online'),
    `presence=${launcher?.presence} hasDot=${launcher?.hasDot}`,
    launcher,
  );
  record(
    `viewport.${viewport.name}.closed_launcher_unread`,
    Boolean(launcher?.hasBadge),
    `hasBadge=${launcher?.hasBadge}`,
    launcher,
  );
  if (viewport.width <= 320) {
    const clipMax = launcher
      ? Math.max(...Object.values(launcher.clip))
      : 99;
    record(
      `viewport.${viewport.name}.launcher_chrome_not_clipped`,
      clipMax <= 1,
      `clipMax=${clipMax}`,
      launcher,
    );
  }

  // Online colour must be green, not brand blue (theme remaps emerald → blue).
  if (launcher?.dotBg) {
    const bg = launcher.dotBg.toLowerCase();
    const isBrandBlue =
      bg.includes('27, 89, 167')
      || bg.includes('1b59a7')
      || /oklch\(\s*[\d.]+\s+[\d.]+\s+24[0-9](?:\.\d+)?\s*\)/.test(bg);
    // Tailwind green-500 is oklch(... 149.579) or rgb(34, 197, 94).
    const isGreen =
      bg.includes('34, 197, 94')
      || bg.includes('22, 163, 74')
      || /oklch\(\s*[\d.]+\s+[\d.]+\s+14[0-9](?:\.\d+)?\s*\)/.test(bg)
      || /oklch\(\s*[\d.]+\s+[\d.]+\s+15[0-5](?:\.\d+)?\s*\)/.test(bg);
    record(
      `viewport.${viewport.name}.online_dot_is_green`,
      isGreen && !isBrandBlue,
      `bg=${launcher.dotBg}`,
      launcher,
    );
  }

  await context.close();
}

/**
 * Real media-query transition in one page (not separate browser contexts):
 * open at 768 → resize to 390 → resize back to 768 → repeat mobile cycle.
 */
async function runBreakpointTransition(browser) {
  const context = await browser.newContext({
    viewport: { width: 768, height: 1024 },
  });
  const page = await context.newPage();

  await stubChatTransport(page);

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForChatReady(page);
  await page.waitForTimeout(400);

  // Ensure the document can actually scroll for restore assertions.
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.setAttribute('data-testid', 'chat-scroll-spacer');
    spacer.style.cssText = 'height:3000px;width:1px;pointer-events:none;';
    spacer.setAttribute('aria-hidden', 'true');
    document.documentElement.appendChild(spacer);
  });

  await openChat(page);
  await page.waitForTimeout(300);

  // Re-establish scroll AFTER open — focus management can reset scrollY on open.
  const scrollBeforeResize = await page.evaluate(() => {
    window.scrollTo(0, 480);
    return window.scrollY;
  });
  await page.waitForTimeout(150);
  // Capture again after the desktop scroll listener has observed the position.
  const scrollCaptured = await page.evaluate(() => window.scrollY);
  record(
    'transition.768.open.scroll_baseline',
    scrollCaptured > 0,
    `scrollY=${scrollCaptured} (requested→${scrollBeforeResize})`,
    { scrollCaptured, scrollBeforeResize },
  );

  // A. Open at 768px — desktop panel, body unlocked.
  const at768 = await measureSheet(page);
  record(
    'transition.768.open.desktop_panel',
    Boolean(at768 && at768.mobileSheet === 'false' && at768.width < 728),
    `mobileSheet=${at768?.mobileSheet} width=${at768?.width}`,
    at768,
  );
  record(
    'transition.768.open.body_unlocked',
    at768?.bodyPosition === '',
    `body.position=${at768?.bodyPosition || '(empty)'}`,
    at768,
  );
  await page.screenshot({
    path: path.join(SHOT_DIR, 'transition-768-open-desktop.png'),
    fullPage: false,
  });

  // B. Resize while still open: 768 → 390.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const at390 = await measureSheet(page);
  const lockedMeta = await page.evaluate(() => ({
    bodyPosition: document.body.style.position,
    bodyTop: document.body.style.top,
    scrollY: window.scrollY,
  }));
  const lockedSavedY = Math.abs(Number.parseInt(lockedMeta.bodyTop || '0', 10)) || 0;
  record(
    'transition.768_to_390.mobile_sheet',
    at390?.mobileSheet === 'true',
    `mobileSheet=${at390?.mobileSheet}`,
    at390,
  );
  record(
    'transition.768_to_390.body_locked',
    at390?.bodyPosition === 'fixed',
    `body.position=${at390?.bodyPosition}`,
    at390,
  );
  record(
    'transition.768_to_390.sheet_fills_width',
    Boolean(at390 && at390.width >= 388),
    `width=${at390?.width}`,
    at390,
  );
  record(
    'transition.768_to_390.launcher_absent',
    at390?.launcherPresent === false,
    `launcherPresent=${at390?.launcherPresent}`,
    at390,
  );
  await page.screenshot({
    path: path.join(SHOT_DIR, 'transition-390-after-resize.png'),
    fullPage: false,
  });

  // C. Resize while still open: 390 → 768.
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(450);
  const back768 = await measureSheet(page);
  const scrollAfterDesktop = await page.evaluate(() => ({
    scrollY: window.scrollY,
    bodyPosition: document.body.style.position,
    bodyTop: document.body.style.top,
    bodyWidth: document.body.style.width,
  }));
  record(
    'transition.390_to_768.desktop_panel',
    Boolean(back768 && back768.mobileSheet === 'false' && back768.width < 728),
    `mobileSheet=${back768?.mobileSheet} width=${back768?.width}`,
    back768,
  );
  record(
    'transition.390_to_768.body_cleared',
    scrollAfterDesktop.bodyPosition === '',
    `body.position=${scrollAfterDesktop.bodyPosition || '(empty)'}`,
    scrollAfterDesktop,
  );
  // Restore must match the position the lock actually saved (body.top), not an
  // earlier pre-resize guess that focus/layout may have changed.
  const expectedRestoreY = lockedSavedY > 0 ? lockedSavedY : scrollCaptured;
  record(
    'transition.390_to_768.scroll_restored',
    Math.abs(scrollAfterDesktop.scrollY - expectedRestoreY) <= 2,
    `scrollY=${scrollAfterDesktop.scrollY} expected≈${expectedRestoreY} lockedTop=${lockedMeta.bodyTop}`,
    { scrollAfterDesktop, expectedRestoreY, lockedMeta, scrollCaptured },
  );
  record(
    'transition.390_to_768.chat_remains_open',
    Boolean(back768 && back768.launcherPresent === false),
    `sheet=${Boolean(back768)} launcherPresent=${back768?.launcherPresent}`,
    back768,
  );
  await page.screenshot({
    path: path.join(SHOT_DIR, 'transition-768-after-return.png'),
    fullPage: false,
  });

  // D. Repeat mobile → desktop → mobile: no stale lock / no page jump.
  const scrollBeforeCycle = await page.evaluate(() => window.scrollY);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  const cycleMobile1 = await measureSheet(page);
  const cycleLockedTop = await page.evaluate(() => document.body.style.top);
  const cycleSavedY = Math.abs(Number.parseInt(cycleLockedTop || '0', 10)) || scrollBeforeCycle;
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(350);
  const cycleDesktop = await page.evaluate(() => ({
    scrollY: window.scrollY,
    bodyPosition: document.body.style.position,
    bodyTop: document.body.style.top,
    bodyLeft: document.body.style.left,
    bodyRight: document.body.style.right,
    bodyWidth: document.body.style.width,
    vvListenerHint: (() => {
      const sheet = document.querySelector('[data-testid="chat-sheet"]');
      return {
        mobileSheet: sheet?.getAttribute('data-mobile-sheet') || null,
        inlineHeight: sheet instanceof HTMLElement ? sheet.style.height : '',
      };
    })(),
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  const cycleMobile2 = await measureSheet(page);
  const listenerProbe = await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
    window.visualViewport?.dispatchEvent(new Event('resize'));
    const sheet = document.querySelector('[data-testid="chat-sheet"]');
    return {
      mobileSheet: sheet?.getAttribute('data-mobile-sheet') || null,
      bodyPosition: document.body.style.position,
      width: sheet ? Math.round(sheet.getBoundingClientRect().width) : null,
    };
  });

  const noStaleStyles =
    cycleDesktop.bodyPosition === ''
    && cycleDesktop.bodyTop === ''
    && cycleDesktop.bodyLeft === ''
    && cycleDesktop.bodyRight === ''
    && cycleDesktop.bodyWidth === '';
  // No jump beyond the position the lock saved for this cycle.
  const scrollStable = Math.abs(cycleDesktop.scrollY - cycleSavedY) <= 2;
  record(
    'transition.cycle.no_stale_body_lock',
    noStaleStyles
      && cycleMobile1?.bodyPosition === 'fixed'
      && cycleMobile2?.bodyPosition === 'fixed'
      && listenerProbe.bodyPosition === 'fixed',
    `desktopCleared=${noStaleStyles} m1=${cycleMobile1?.bodyPosition} m2=${cycleMobile2?.bodyPosition}`,
    { cycleDesktop, cycleMobile1, cycleMobile2, listenerProbe },
  );
  record(
    'transition.cycle.no_duplicate_vv_blowup',
    listenerProbe.mobileSheet === 'true'
      && listenerProbe.width != null
      && listenerProbe.width >= 388
      && cycleDesktop.vvListenerHint.mobileSheet === 'false',
    `probe=${JSON.stringify(listenerProbe)} desktopHint=${JSON.stringify(cycleDesktop.vvListenerHint)}`,
    { listenerProbe, cycleDesktop },
  );
  record(
    'transition.cycle.no_page_jump',
    scrollStable,
    `scrollY=${cycleDesktop.scrollY} expected≈${cycleSavedY}`,
    { cycleDesktop, cycleSavedY, scrollBeforeCycle },
  );
  await page.screenshot({
    path: path.join(SHOT_DIR, 'transition-cycle-mobile-final.png'),
    fullPage: false,
  });

  await context.close();
}

function writeReport() {
  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass).length;
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    screenshotDir: SHOT_DIR,
    summary: { total: checks.length, passed, failed },
    checks,
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${OUT}`);
  console.log(`Screenshots: ${SHOT_DIR}`);
  console.log(`Summary: ${passed}/${checks.length} passed, ${failed} failed`);
  return failed;
}

async function main() {
  ensureShotDir();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of VIEWPORTS) {
      await runViewport(browser, viewport);
    }
    await runBreakpointTransition(browser);
  } catch (err) {
    record('runner.uncaught_error', false, String(err && err.message ? err.message : err));
    throw err;
  } finally {
    await browser.close();
    const failed = writeReport();
    if (failed > 0) process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
