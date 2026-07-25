/**
 * Phase 2F-1.1.2: real-device mobile chat layout correction tests.
 * Presentation / client layout only — no Prisma / API / persistence changes.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMobileSheetViewportStyle,
  isVisitorChatCompactViewport,
  isVisitorChatMobileViewport,
  VISITOR_CHAT_COMPACT_MAX_WIDTH_PX,
  VISITOR_CHAT_MOBILE_MAX_WIDTH_PX,
  VISITOR_CHAT_MOBILE_MQ,
} from './visitorChatMobileLayout.ts';
import {
  VISITOR_HEADER_STATUS_DOT_CLASS,
  VISITOR_PRESENCE_DOT_CLASS,
  resolveVisitorPresenceTone,
} from './visitorChatUi.ts';
import {
  clearBodyScrollStyles,
  lockBodyScroll,
  unlockBodyScroll,
} from './visitorChatBodyScroll.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('Phase 2F-1.1.2 mobile sheet layout helpers', () => {
  test('mobile breakpoint is below 640px', () => {
    assert.equal(VISITOR_CHAT_MOBILE_MAX_WIDTH_PX, 639);
    assert.equal(isVisitorChatMobileViewport(320), true);
    assert.equal(isVisitorChatMobileViewport(639), true);
    assert.equal(isVisitorChatMobileViewport(640), false);
    assert.equal(VISITOR_CHAT_MOBILE_MQ, '(max-width: 639px)');
  });

  test('compact content breakpoint is below 480px', () => {
    assert.equal(VISITOR_CHAT_COMPACT_MAX_WIDTH_PX, 479);
    assert.equal(isVisitorChatCompactViewport(320), true);
    assert.equal(isVisitorChatCompactViewport(479), true);
    assert.equal(isVisitorChatCompactViewport(480), false);
  });

  test('mobile sheet uses full viewport width and dvh fallback', () => {
    const fallback = buildMobileSheetViewportStyle(null);
    assert.equal(fallback.width, '100dvw');
    assert.equal(fallback.height, '100dvh');
    assert.equal(fallback.maxWidth, 'none');
    assert.equal(fallback.maxHeight, 'none');
    assert.equal(fallback.margin, '0');
    assert.equal(fallback.borderRadius, '0');
    assert.equal(fallback.position, 'fixed');

    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /h-\[100vh\]/);
    assert.match(liveChat, /h-\[100dvh\]/);
    assert.match(liveChat, /w-\[100dvw\]/);
    assert.match(liveChat, /rounded-none/);
    assert.doesNotMatch(
      liveChat,
      /isMobileSheet[\s\S]{0,220}h-\[100vh\](?![\s\S]{0,80}h-\[100dvh\])/,
    );
  });

  test('visualViewport update keeps sheet within visible height', () => {
    const style = buildMobileSheetViewportStyle({
      height: 360,
      offsetTop: 40,
      offsetLeft: 0,
      width: 320,
    });
    assert.equal(style.height, '360px');
    assert.equal(style.top, '40px');
    assert.equal(style.width, '320px');
    assert.equal(style.left, '0px');
  });

  test('LiveChat wires visualViewport listeners for keyboard support', () => {
    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /visualViewport/);
    assert.match(liveChat, /buildMobileSheetViewportStyle/);
    assert.match(liveChat, /addEventListener\('resize'/);
    assert.match(liveChat, /addEventListener\('scroll'/);
    assert.match(
      liveChat,
      /useEffect\(\(\) => \{[\s\S]*?if \(!chatSurfaceOpen\) \{[\s\S]*?setMobileSheetStyle\(null\)[\s\S]*?if \(!isMobileViewport\) \{[\s\S]*?setMobileSheetStyle\(null\)[\s\S]*?\}, \[chatSurfaceOpen, isMobileViewport\]\)/,
    );
    assert.doesNotMatch(
      liveChat,
      /syncVisualViewport = \(\) => \{[\s\S]*?matchMedia\(VISITOR_CHAT_MOBILE_MQ\)/,
    );
  });
});

describe('Phase 2F-1.1.2 launcher and close actions', () => {
  test('launcher is absent while chat is open', () => {
    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /showLauncher/);
    assert.match(liveChat, /const showLauncher = !chatSurfaceOpen/);
    assert.match(liveChat, /\{showLauncher \? \(/);
    assert.doesNotMatch(
      liveChat,
      /onClick=\{\(\) => \{\s*if \(isOpen && !isMinimized\) \{\s*closeChatWidget\(\)/,
    );
  });

  test('exactly one close action is present in the open sheet', () => {
    const header = read('src/components/chat/ChatHeader.tsx');
    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(header, /aria-label="Close chat"/);
    assert.match(header, /data-testid="chat-close"/);
    assert.match(header, /aria-label="Minimise chat"/);
    // Launcher no longer renders an X close while open.
    assert.doesNotMatch(liveChat, /isOpen && !isMinimized \?[\s\S]{0,80}<X /);
    assert.equal((header.match(/aria-label="Close chat"/g) || []).length, 1);
  });

  test('open sheet exposes dialog semantics for mobile', () => {
    const liveChat = read('src/components/LiveChat.tsx');
    const header = read('src/components/chat/ChatHeader.tsx');
    assert.match(liveChat, /role="dialog"/);
    assert.match(liveChat, /aria-modal=\{isMobileSheet \? true : false\}/);
    assert.match(liveChat, /data-testid="chat-sheet"/);
    assert.match(liveChat, /data-testid="chat-message-area"/);
    assert.match(liveChat, /data-testid="chat-composer"/);
    assert.match(header, /data-testid="chat-header"/);
    assert.match(liveChat, /prefersReducedMotion|prefers-reduced-motion/);
    assert.match(liveChat, /Escape/);
    assert.match(liveChat, /launcherRef\.current\?\.focus/);
  });
});

describe('Phase 2F-1.1.2 three-region layout and overflow', () => {
  test('header and composer are non-scrolling; message area scrolls', () => {
    const liveChat = read('src/components/LiveChat.tsx');
    const header = read('src/components/chat/ChatHeader.tsx');
    assert.match(header, /shrink-0|flex-0/);
    assert.match(liveChat, /min-h-0 flex-1[\s\S]*overflow-y-auto overscroll-contain/);
    assert.match(liveChat, /data-testid="chat-composer"[\s\S]*shrink-0/);
  });

  test('compact mobile content prevents horizontal overflow from long text', () => {
    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /\[overflow-wrap:anywhere\]/);
    assert.match(liveChat, /max-w-\[min\(92%,18\.5rem\)\]|max-w-\[min\(85%,20rem\)\]/);
    const intents = read('src/components/chat/ChatIntentChooser.tsx');
    assert.match(intents, /min-h-\[48px\]/);
    assert.match(intents, /text-\[15px\]/);
  });

  test('safe-area padding is not double-applied on sheet and composer', () => {
    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /pt-\[env\(safe-area-inset-top\)\]/);
    assert.match(
      liveChat,
      /data-testid="chat-composer"[\s\S]*pb-\[max\(0\.75rem,env\(safe-area-inset-bottom\)\)\]/,
    );
    // Outer sheet must not also set paddingBottom safe-area.
    assert.doesNotMatch(
      liveChat,
      /data-testid="chat-sheet"[\s\S]{0,400}paddingBottom:\s*['"]env\(safe-area-inset-bottom\)/,
    );
  });
});

describe('Phase 2F-1.1.2 presence colour semantics', () => {
  test('online state maps to green (not theme-remapped emerald/blue)', () => {
    assert.equal(
      resolveVisitorPresenceTone({ availabilityStatus: 'online', serviceAvailable: true }),
      'online',
    );
    assert.match(VISITOR_PRESENCE_DOT_CLASS.online, /green/);
    assert.doesNotMatch(VISITOR_PRESENCE_DOT_CLASS.online, /emerald|brand-blue|blue/);
    assert.match(VISITOR_HEADER_STATUS_DOT_CLASS.team_online, /green/);
    assert.match(VISITOR_PRESENCE_DOT_CLASS.away, /amber/);
    assert.match(VISITOR_PRESENCE_DOT_CLASS.automated, /slate|gray|grey/i);
    assert.match(VISITOR_PRESENCE_DOT_CLASS.unavailable, /red/);

    const theme = read('src/index.css');
    assert.match(theme, /--color-emerald-500:\s*#1B59A7/);
    // Ensure we do not rely on remapped emerald for presence.
    const ui = read('src/lib/chat/visitorChatUi.ts');
    assert.doesNotMatch(ui, /online:\s*'bg-emerald/);
  });
});

describe('Phase 2F-1.1.2 body scroll lock', () => {
  test('background body lock clears on close', () => {
    const bodyStyle = {
      position: '',
      top: '',
      left: '',
      right: '',
      width: '',
    };
    const saved = lockBodyScroll({
      currentScrollY: 240,
      bodyStyle,
    });
    assert.equal(saved, 240);
    assert.equal(bodyStyle.position, 'fixed');

    let scrolledTo = -1;
    unlockBodyScroll({
      restorePosition: true,
      savedScrollY: saved,
      bodyStyle,
      scrollTo: (_x, y) => {
        scrolledTo = y;
      },
    });
    assert.equal(bodyStyle.position, '');
    assert.equal(scrolledTo, 240);

    clearBodyScrollStyles(bodyStyle);
    assert.equal(bodyStyle.top, '');

    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /lockBodyScroll\(\)/);
    assert.match(liveChat, /unlockBodyScroll\(\{ restorePosition: true \}\)/);
    assert.match(
      liveChat,
      /if \(!chatSurfaceOpen \|\| !isMobileViewport\) \{\s*return undefined;\s*\}/,
    );
    assert.match(
      liveChat,
      /chatSurfaceOpen,\s*isMobileViewport,\s*lockBodyScroll,\s*unlockBodyScroll,/,
    );
    // Body-lock effect must not re-query matchMedia before locking.
    assert.doesNotMatch(
      liveChat,
      /matchMedia\(VISITOR_CHAT_MOBILE_MQ\)\.matches;\s*if \(isOpen && !isMinimized && isMobile\) \{\s*lockBodyScroll\(\)/,
    );
    assert.doesNotMatch(
      liveChat,
      /if \(!chatSurfaceOpen \|\| !isMobileViewport\)[\s\S]{0,120}matchMedia\(VISITOR_CHAT_MOBILE_MQ\)/,
    );
    assert.match(liveChat, /unlockBodyScroll\(\{ restorePosition: false \}\)/);
  });
});

describe('Phase 2F-1.1.2 scope guard', () => {
  test('no Prisma / migration / API transport edits in this phase', () => {
    const mobile = read('src/lib/chat/visitorChatMobileLayout.ts');
    assert.doesNotMatch(mobile, /prisma|@prisma|fetch\(|XMLHttpRequest/i);
    const liveChat = read('src/components/LiveChat.tsx');
    assert.match(liveChat, /reconcileVisitorPollState/);
    assert.match(liveChat, /chatIsOpenRef/);
  });
});
