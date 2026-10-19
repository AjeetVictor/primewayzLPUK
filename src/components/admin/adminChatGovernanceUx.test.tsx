import { adminTestWindow } from './adminUxDomPreload.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test, { afterEach } from 'node:test';
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Window as HappyDomWindow } from 'happy-dom';
import { AdminChatConnectInstallations } from './AdminChatConnectInstallations.tsx';
import { AdminTenantChatEntitlements } from './AdminTenantChatEntitlements.tsx';

type Call = { path: string; method: string; body: string | null };
type Reply = { status?: number; body: Record<string, unknown> };

let root: Root | null = null;

afterEach(async () => {
  await act(async () => {
    root?.unmount();
  });
  root = null;
  adminTestWindow.document.body.innerHTML = '';
});

function installWindow(): HappyDomWindow {
  return adminTestWindow as unknown as HappyDomWindow;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

async function render(node: ReactElement) {
  const win = installWindow();
  const container = win.document.createElement('div');
  win.document.body.appendChild(container);
  root = createRoot(container as never);
  await act(async () => {
    root?.render(node);
  });
  return win;
}

function setNativeValue(element: any, value: string) {
  const view = element.ownerDocument.defaultView;
  const prototype = element instanceof view.HTMLSelectElement
    ? view.HTMLSelectElement.prototype
    : element instanceof view.HTMLTextAreaElement
      ? view.HTMLTextAreaElement.prototype
      : view.HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (!descriptor?.set) throw new Error(`Missing value setter for ${element.tagName}`);
  descriptor.set.call(element, value);
  const propsKey = Object.getOwnPropertyNames(element).find((key) => key.startsWith('__reactProps'));
  const direct = propsKey ? element[propsKey]?.onChange : undefined;
  const onChange = direct ?? findReactChange(element);
  if (!onChange) throw new Error(`Missing React onChange for ${element.tagName}`);
  onChange({ target: element, currentTarget: element });
}

function findReactChange(element: any): ((event: any) => void) | undefined {
  let node = element.parentNode;
  let fiber: any;
  while (node && !fiber) {
    const key = Object.getOwnPropertyNames(node).find((name: string) => name.startsWith('__reactFiber'));
    fiber = key ? node[key] : undefined;
    node = node.parentNode;
  }
  const stack = fiber ? [fiber] : [];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    if (current.stateNode === element && current.memoizedProps?.onChange) return current.memoizedProps.onChange;
    if (current.child) stack.push(current.child);
    if (current.sibling) stack.push(current.sibling);
  }
  return undefined;
}

function buttonByName(win: { document: { querySelectorAll: (selector: string) => Iterable<{ textContent: string | null }> } }, name: string) {
  const match = [...win.document.querySelectorAll('button')].find((button) => button.textContent?.trim() === name);
  assert.ok(match, `Missing button: ${name}`);
  return match as unknown as { type?: string; textContent: string | null; click: () => void } & Parameters<typeof clickControl>[0];
}

function press(button: { type?: string; click: () => void } & Parameters<typeof clickControl>[0]) {
  if (button.type === 'submit') {
    button.click();
    return;
  }
  clickControl(button);
}

function clickControl(element: {
  dispatchEvent: (event: Event) => boolean;
  ownerDocument: { defaultView: { MouseEvent: new (type: string, init: { bubbles: boolean }) => Event } | null };
}) {
  const propsKey = Object.getOwnPropertyNames(element).find((key) => key.startsWith('__reactProps'));
  const props = propsKey
    ? (element as unknown as Record<string, { onClick?: (event: { preventDefault: () => void; target: object; currentTarget: object }) => void }>)[propsKey]
    : undefined;
  if (props?.onClick) {
    props.onClick({ preventDefault() {}, target: element, currentTarget: element });
    return;
  }
  const view = element.ownerDocument.defaultView;
  if (!view) throw new Error('Missing window');
  element.dispatchEvent(new view.MouseEvent('click', { bubbles: true }));
}

const installation = {
  id: 'cci_pw_uk_first_party',
  tenantBrand: 'Primewayz',
  tenantDisplayName: 'Primewayz UK',
  tenantKey: 'pw-uk',
  integrationTechnology: 'react',
  addonVersion: null,
  widgetVersion: '1.2.0',
  authorizationStatus: 'active' as const,
  connectionHealth: 'unknown' as const,
  frontendVisibility: 'hidden' as const,
  registeredAt: '2026-10-19T12:00:00.000Z',
  provisionedAt: null,
  activatedAt: null,
  lastVerifiedHeartbeatAt: null,
  lastAuthenticatedActivityAt: null,
  legacyEnvBinding: false,
  classification: 'first-party' as const,
};

const infotech = {
  ...installation,
  id: 'cci_pw_infotech_wordpress',
  tenantDisplayName: 'Primewayz Infotech',
  tenantKey: 'pw-infotech',
  integrationTechnology: 'wordpress',
  authorizationStatus: 'suspended' as const,
  legacyEnvBinding: true,
  classification: 'legacy-environment' as const,
};

function listBody(installations: object[] = [installation, infotech]): Reply['body'] {
  return {
    success: true,
    heartbeatIntervalSeconds: 300,
    connectorTechnologies: ['wordpress'],
    installations,
    tenants: [
      { tenantId: 'pw-uk', brand: 'Primewayz', displayName: 'Primewayz UK', registryActive: true, activationControlled: false },
      { tenantId: 'pw-infotech', brand: 'Primewayz', displayName: 'Primewayz Infotech', registryActive: true, activationControlled: false },
    ],
  };
}

test('governance screens avoid native dialogs and keep a narrow-screen record layout', () => {
  for (const relativePath of [
    'src/components/admin/AdminChatConnectInstallations.tsx',
    'src/components/admin/AdminTenantChatEntitlements.tsx',
  ]) {
    const source = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
    assert.doesNotMatch(source, /(?:window\.)?(?:confirm|alert|prompt)\s*\(/);
    assert.match(source, /xl:hidden/);
    assert.match(source, /hidden overflow-x-auto/);
    assert.match(source, /AdminError/);
    assert.match(source, /AdminField/);
  }
  const fields = fs.readFileSync(path.join(process.cwd(), 'src/components/admin/adminUx.tsx'), 'utf8');
  assert.match(fields, /htmlFor=\{id\}/);
  const dialog = fs.readFileSync(path.join(process.cwd(), 'src/components/ui/AppConfirmDialog.tsx'), 'utf8');
  assert.match(dialog, /Dialog\.Content/);
  assert.match(dialog, /onOpenAutoFocus/);
  assert.match(dialog, /aria-disabled/);
});

test('installation list loads, filters, and confirms suspension before calling the API', async () => {
  const calls: Call[] = [];
  const request = async (requestPath: string, init?: RequestInit) => {
    calls.push({ path: requestPath, method: init?.method ?? 'GET', body: typeof init?.body === 'string' ? init.body : null });
    return jsonResponse(listBody());
  };
  const win = await render(createElement(AdminChatConnectInstallations, { canManage: true, request }));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.match(win.document.body.textContent ?? '', /Primewayz UK/);
  assert.match(win.document.body.textContent ?? '', /Primewayz Infotech/);
  assert.equal(calls.length, 1);

  const search = win.document.querySelector('input[type="search"]') as unknown as Parameters<typeof setNativeValue>[0];
  await act(async () => {
    setNativeValue(search, 'infotech');
  });
  const filtered = win.document.body.textContent ?? '';
  assert.match(filtered, /1 of 2 installations/);
  assert.doesNotMatch(filtered, /cci_pw_uk_first_party/);
  assert.match(filtered, /cci_pw_infotech_wordpress/);

  await act(async () => {
    setNativeValue(search, '');
  });
  await act(async () => {
    press(buttonByName(win, 'Suspend'));
  });
  const dialog = win.document.querySelector('[role="dialog"]');
  assert.ok(dialog);
  assert.match(dialog?.textContent ?? '', /Suspend cci_pw_uk_first_party|Suspend Primewayz UK/);
  assert.equal(win.document.activeElement?.textContent?.trim(), 'Cancel');
  assert.equal(calls.filter((call) => call.method === 'POST').length, 0);

  await act(async () => {
    press(buttonByName(win, 'Cancel'));
  });
  assert.equal(win.document.querySelector('[role="dialog"]'), null);

  await act(async () => {
    press(buttonByName(win, 'Suspend'));
  });
  await act(async () => {
    press(buttonByName(win, 'Suspend installation'));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const suspend = calls.find((call) => call.path.endsWith('/suspend'));
  assert.ok(suspend);
  assert.equal(suspend?.method, 'POST');
  assert.equal(calls.filter((call) => call.path.includes('/revoke')).length, 0);
});

test('a revoked installation cannot be revoked again and a new credential is not announced as text', async () => {
  const calls: Call[] = [];
  const revoked = { ...installation, authorizationStatus: 'revoked' as const };
  const request = async (requestPath: string, init?: RequestInit) => {
    calls.push({ path: requestPath, method: init?.method ?? 'GET', body: typeof init?.body === 'string' ? init.body : null });
    if (init?.method === 'POST') {
      return jsonResponse({
        success: true,
        credential: { keyId: 'key_once', secret: 'super-secret-value' },
        installation: installation,
      });
    }
    return jsonResponse(listBody([revoked]));
  };
  const win = await render(createElement(AdminChatConnectInstallations, { canManage: true, request }));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.equal([...win.document.querySelectorAll('button')].some((button) => button.textContent?.trim() === 'Revoke'), false);
  await act(async () => {
    press(buttonByName(win, 'Register installation'));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const credentialField = [...win.document.querySelectorAll('input')].find((input) => (input as unknown as { value: string }).value.includes('super-secret-value')) as unknown as { value: string; getAttribute: (name: string) => string | null; parentElement: unknown };
  assert.equal(credentialField.value, 'key_once.super-secret-value');
  assert.equal(credentialField.getAttribute('autocomplete'), 'off');
  for (const status of win.document.querySelectorAll('[role="status"]')) {
    assert.doesNotMatch(status.textContent ?? '', /super-secret-value/);
  }
  assert.match(win.document.body.textContent ?? '', /Credential shown once/);
  assert.equal(win.document.activeElement, credentialField.parentElement);
});

test('entitlement changes require a status and reason before confirmation', async () => {
  const calls: Call[] = [];
  const request = async (requestPath: string, init?: RequestInit) => {
    calls.push({ path: requestPath, method: init?.method ?? 'GET', body: typeof init?.body === 'string' ? init.body : null });
    return jsonResponse({
      success: true,
      canManage: true,
      tenants: [{
        tenantId: 'pw-uk',
        displayName: 'Primewayz UK',
        brand: 'Primewayz',
        market: 'United Kingdom',
        registryActive: true,
        activationControlled: false,
        compileTimeChat: true,
        entitlement: null,
        effective: { allowed: true, basis: 'allowed_existing' },
        recentChanges: [],
      }],
    });
  };
  const win = await render(createElement(AdminTenantChatEntitlements, { canManage: true, request }));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.match(win.document.body.textContent ?? '', /No central record/);
  await act(async () => {
    press(buttonByName(win, 'Save entitlement'));
  });
  assert.equal(win.document.querySelector('[role="dialog"]'), null);
  assert.match(win.document.body.textContent ?? '', /Choose a status/);
  assert.equal(calls.filter((call) => call.method === 'POST').length, 0);

  const status = [...win.document.querySelectorAll('select')].find((select) => select.textContent?.includes('Select a status')) as unknown as Parameters<typeof setNativeValue>[0];
  await act(async () => {
    setNativeValue(status, 'suspended');
  });
  await act(async () => {
    press(buttonByName(win, 'Save entitlement'));
  });
  assert.match(win.document.body.textContent ?? '', /Write a reason/);
  assert.equal(win.document.querySelector('[role="dialog"]'), null);

  const reason = [...win.document.querySelectorAll('input')].find((input) => input.getAttribute('maxlength') === '512') as unknown as Parameters<typeof setNativeValue>[0];
  await act(async () => {
    setNativeValue(reason, 'Contract pause');
  });
  await act(async () => {
    press(buttonByName(win, 'Save entitlement'));
  });
  const dialog = win.document.querySelector('[role="dialog"]');
  assert.match(dialog?.textContent ?? '', /Primewayz UK/);
  assert.match(dialog?.textContent ?? '', /Suspended/);
  assert.match(dialog?.textContent ?? '', /Contract pause/);
  assert.equal(calls.filter((call) => call.method === 'POST').length, 0);
  assert.equal(win.document.activeElement?.textContent?.trim(), 'Cancel');
});

test('operators who are not Host/Owner do not see the entitlement form', async () => {
  const request = async () => jsonResponse({
    success: true,
    canManage: false,
    tenants: [{
      tenantId: 'pw-uk',
      displayName: 'Primewayz UK',
      brand: 'Primewayz',
      market: 'United Kingdom',
      registryActive: true,
      activationControlled: true,
      compileTimeChat: true,
      entitlement: { status: 'suspended', reason: 'Paused', updatedAt: '2026-10-19T12:00:00.000Z', updatedByUserId: 1 },
      effective: { allowed: false, basis: 'suspended' },
      recentChanges: [],
    }],
  });
  const win = await render(createElement(AdminTenantChatEntitlements, { canManage: false, request }));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.match(win.document.body.textContent ?? '', /limited to the platform Host\/Owner/);
  assert.equal([...win.document.querySelectorAll('button')].some((button) => button.textContent?.includes('Save entitlement')), false);
  assert.match(win.document.body.textContent ?? '', /Suspended/);
});
