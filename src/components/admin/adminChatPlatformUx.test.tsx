import { adminTestWindow } from './adminUxDomPreload.ts';
import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AdminChatPlatform } from './AdminChatPlatform.tsx';
import { adminDangerButtonClass, adminPrimaryButtonClass, adminSecondaryButtonClass } from './adminUx.tsx';

let root: Root | null = null;

afterEach(async () => {
  await act(async () => {
    root?.unmount();
  });
  root = null;
  adminTestWindow.document.body.innerHTML = '';
});

async function render(node: ReactElement) {
  const container = adminTestWindow.document.createElement('div');
  adminTestWindow.document.body.appendChild(container);
  root = createRoot(container as never);
  await act(async () => {
    root?.render(node);
  });
  return adminTestWindow;
}

test('chat platform navigation exposes hover, focus, and current page', async () => {
  const win = await render(createElement(AdminChatPlatform, {
    section: 'chat-platform',
    onSection: () => undefined,
    canManage: false,
    request: async () => ({ ok: true, json: async () => ({ success: true, tenants: { registered: 0 }, installations: { unreported: 0 }, entitlements: {}, alerts: [], recentEvents: [], registry: 'ready' }) }) as Response,
  }));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.match(win.document.body.textContent ?? '', /Primewayz Chat Platform/);
  assert.match(win.document.body.textContent ?? '', /Primewayz Chat Connect/);
  const nav = win.document.querySelector('nav');
  assert.equal(nav?.getAttribute('aria-label'), 'Chat Platform sections');
  const buttons = [...nav!.querySelectorAll('button')];
  assert.equal(buttons.length, 10);
  assert.equal(buttons[0]?.getAttribute('aria-current'), 'page');
  assert.match(buttons[1]?.className ?? '', /hover:bg-white/);
  assert.match(buttons[1]?.className ?? '', /focus-visible:outline/);
  assert.match(buttons[1]?.className ?? '', /active:bg-zinc-100/);
  assert.equal(buttons[1]?.getAttribute('type'), 'button');
  assert.match(adminPrimaryButtonClass, /hover:bg-zinc-700/);
  assert.match(adminPrimaryButtonClass, /disabled:cursor-not-allowed/);
  assert.match(adminSecondaryButtonClass, /hover:bg-zinc-100/);
  assert.match(adminDangerButtonClass, /hover:bg-red-50/);
  assert.match(adminDangerButtonClass, /focus-visible:outline/);
});

test('operators see a permission denied state for grant changes', async () => {
  let section = 'platform-users';
  const win = await render(createElement(AdminChatPlatform, {
    section,
    onSection: (next: string) => { section = next; },
    canManage: false,
    request: async () => ({ ok: true, json: async () => ({ success: true }) }) as Response,
  }));
  assert.match(win.document.body.textContent ?? '', /Permission denied for grant changes/);
  const users = [...win.document.querySelectorAll('button')].find((button) => button.textContent === 'Users & Permissions');
  assert.ok(users);
  users.dispatchEvent(new adminTestWindow.MouseEvent('click', { bubbles: true }));
});
