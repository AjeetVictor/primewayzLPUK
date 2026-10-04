import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
const server = read('server.ts');
const liveChat = read('src/components/LiveChat.tsx');
const adminChatRoutes = read('src/lib/admin/adminChatRoutes.ts');

function routeSource(startMarker: string): string {
  const start = server.indexOf(startMarker);
  assert.notEqual(start, -1, `missing route ${startMarker}`);
  const next = server.indexOf('\napp.', start + startMarker.length);
  return server.slice(start, next === -1 ? undefined : next);
}

function functionSource(marker: string): string {
  const start = server.indexOf(marker);
  assert.notEqual(start, -1, `missing ${marker}`);
  const end = server.indexOf('\n}\n', start);
  return server.slice(start, end);
}

const adminReplyRoute = routeSource("app.post('/api/chat', ");
const respondRoute = routeSource("app.post('/api/chat/respond'");
const sessionRoute = routeSource("app.post('/api/chat/session'");
const heartbeatRoute = routeSource("app.post('/api/chat/heartbeat'");
const historyRoute = routeSource("app.get('/api/chat/:sessionId'");
const availabilityRoute = routeSource("app.get('/api/chat/availability'");
const appointmentRoute = routeSource("app.post('/api/chat/appointments'");

// --- Sender spoofing ---

test('POST /api/chat requires an authenticated operations admin before the handler runs', () => {
  assert.match(adminReplyRoute, /^app\.post\('\/api\/chat', requireAdmin, requireRole\(isOperationsRole\), adminChatHandlers\.reply\)/);
});

test('requireAdmin rejects missing / invalid admin sessions with 401 and requireRole uses 403', () => {
  const requireAdmin = functionSource('async function requireAdmin(');
  assert.match(requireAdmin, /if \(!token\) return res\.status\(401\)/);
  assert.match(requireAdmin, /catch \{\s*return res\.status\(401\)/);
  assert.match(functionSource('function requireRole('), /res\.status\(403\)/);
});

test('unauthenticated sender=admin and sender=bot can no longer be posted publicly', () => {
  assert.doesNotMatch(adminReplyRoute, /resolveRequestSource\(req, 'chat'\)/, 'no public fallback path remains');
  assert.doesNotMatch(server, /getAdminUserFromRequest/);
  assert.match(adminChatRoutes, /if \(!isPermittedAdminChatReplySender\(sender\)\) \{\s*throw new AdminChatAccessError\(403, 'sender_not_allowed'/);
});

test('authenticated admin reply behaviour and internal notes are preserved', () => {
  const conversationService = read('src/lib/chat/chatConversationService.ts');
  const conversationStore = read('src/lib/chat/chatConversationPrismaStore.ts');
  assert.match(adminChatRoutes, /isInternalNote: Boolean\(isInternalNote\)/);
  assert.match(adminChatRoutes, /createTeamReply\(tx, \{[\s\S]*?isInternalNote: input\.isInternalNote,[\s\S]*?terminalPolicy: 'append_without_status_change'/);
  assert.match(adminChatRoutes, /res\.status\(201\)\.json\(message\)/);
  assert.match(conversationService, /if \(!input\.isInternalNote\) \{\s*statusChanged = await advanceConversationStatus\(tx, session\.id, 'admin_replied'/);
  assert.match(conversationService, /if \(!input\.isInternalNote\) await markVisitorMessagesAnswered\(tx, session\.id\)/);
  assert.match(conversationStore, /where: \{ sessionId, sender: 'user', answered: false \},\s*data: \{ answered: true \}/);
  assert.match(server, /createAdminChatRouteHandlers\(\{\s*store: adminChatStore,\s*conversations: chatConversationStore,/);
});

test('admin UIs still post admin replies with credentials to POST /api/chat (tenant-scoped)', () => {
  assert.match(
    read('src/components/AdminPanel.tsx'),
    /fetch\(adminTenantQuery\('\/api\/chat'\), \{\s*method: 'POST',\s*credentials: 'include',[\s\S]*?sender: 'admin'/,
  );
  assert.match(
    read('src/components/AdminMobileChat.tsx'),
    /fetch\(apiUrl\(tenantQuery\('\/api\/chat'\)\), \{\s*method: 'POST',\s*credentials: 'include',[\s\S]*?sender: 'admin'/,
  );
});

// --- Visitor routes ---

test('visitor /api/chat/respond still stores sender=user and returns the existing payload', () => {
  assert.match(respondRoute, /sender: 'user'/);
  assert.match(respondRoute, /sender: 'bot'/);
  assert.match(respondRoute, /userMessage: formatVisitorMessage\(userMessage\)/);
  assert.match(respondRoute, /botMessage: formatVisitorMessage\(botMessage\)/);
  assert.match(respondRoute, /availability: await getChatAvailabilityPayload\(sourceContext\)/);
});

test('respond guards run before any write', () => {
  const order = [
    "resolveRequestSource(req, 'chat')",
    "enforceChatRateLimit(req, 'message', sourceContext, sessionId)",
    'validateChatRespondInput(req.body)',
    'assertChatSessionSource(sessionId, sourceContext)',
    'assertPublicChatReferencesOwned(publicChatReferenceStore, sessionId',
    'prisma.chatSession.upsert',
  ].map((marker) => {
    const index = respondRoute.indexOf(marker);
    assert.notEqual(index, -1, marker);
    return index;
  });
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test('every public chat route applies its rate-limit category and guard error handling', () => {
  const expectations: Array<[string, string]> = [
    [availabilityRoute, "enforceChatRateLimit(req, 'read', sourceContext)"],
    [historyRoute, "enforceChatRateLimit(req, 'read', sourceContext, req.params.sessionId)"],
    [heartbeatRoute, "enforceChatRateLimit(req, 'heartbeat', sourceContext, sessionId)"],
    [sessionRoute, "enforceChatRateLimit(req, 'session', sourceContext, sessionId)"],
    [respondRoute, "enforceChatRateLimit(req, 'message', sourceContext, sessionId)"],
    [appointmentRoute, "enforceChatRateLimit(req, 'appointment', sourceContext, sessionId)"],
  ];
  for (const [route, marker] of expectations) {
    assert.ok(route.includes(marker), marker);
    assert.match(route, /publicChatGuardFailure\(res, (err|error)\)/, marker);
  }
  assert.doesNotMatch(adminReplyRoute, /enforceChatRateLimit/);
});

test('rate-limited responses set Retry-After and use the shared guard error body', () => {
  const failure = functionSource('function publicChatGuardFailure(');
  assert.match(failure, /res\.setHeader\('Retry-After', String\(error\.retryAfterSeconds\)\)/);
  assert.match(failure, /res\.status\(error\.status\)\.json\(error\.toResponseBody\(\)\)/);
  assert.match(functionSource('function enforceChatRateLimit('), /tenantId: sourceContext\.tenantId,\s*clientIp: getClientIp\(req\)/);
});

test('every visitor route validates session ids through the shared helper', () => {
  const helper = functionSource('async function assertChatSessionSource(');
  assert.match(helper, /assertChatSessionIdShape\(sessionId\)/);
  assert.match(helper, /validateExistingOrNewChatSessionId\(/);
  for (const route of [historyRoute, heartbeatRoute, sessionRoute, respondRoute, appointmentRoute]) {
    assert.match(route, /await assertChatSessionSource\(/);
  }
});

test('heartbeat and session responses no longer return the full ChatSession row', () => {
  for (const route of [heartbeatRoute, sessionRoute]) {
    assert.doesNotMatch(route, /res\.json\(session\)/);
    assert.match(route, /res\.json\(toPublicChatSessionResponse\(session\)\)/);
    assert.match(route, /toPublicChatSessionResponse\(\{ id: sessionId, status: 'new' \}, \{ unavailable: true \}\)/);
  }
});

test('source identity is still server-derived for public chat routes', () => {
  for (const route of [availabilityRoute, historyRoute, heartbeatRoute, sessionRoute, respondRoute]) {
    assert.match(route, /resolveRequestSource\(req, 'chat'\)/);
  }
  assert.match(appointmentRoute, /resolveRequestSource\(req, 'booking'\)/);
  assert.match(respondRoute, /toPersistedSourceContext\(sourceContext\)/);
});

test('TRUST_PROXY is documented in .env.example', () => {
  const envExample = read('.env.example');
  assert.match(envExample, /^TRUST_PROXY=/m);
  assert.match(envExample, /TRUST_PROXY=1/);
  assert.match(server, /process\.env\.TRUST_PROXY === '1' \|\| process\.env\.TRUST_PROXY === 'true'/);
});

// --- Visitor widget ---

test('LiveChat generates new session ids with the secure generator', () => {
  assert.match(liveChat, /const newId = generateChatSessionId\(\);/);
  assert.doesNotMatch(liveChat, /Math\.random\(\)\.toString\(36\)\.substring\(7\)/);
  assert.match(liveChat, /localStorage\.getItem\('chat_session_id'\);\s*if \(saved\) return saved;/, 'legacy ids are kept');
});

test('LiveChat replaces an unknown weak id once and retries a single time', () => {
  assert.match(liveChat, /shouldReplaceRejectedChatSessionId\(rejectedSessionId, res\.status, body\)/);
  assert.match(liveChat, /localStorage\.setItem\('chat_session_id', nextSessionId\)/);
  assert.match(liveChat, /return replacementSessionId \? send\(replacementSessionId\) : res;/);
  for (const endpoint of ['/api/chat/heartbeat', '/api/chat/session', '/api/chat/respond', '/api/chat/appointments']) {
    assert.ok(liveChat.includes(`postVisitorChat('${endpoint}'`), endpoint);
  }
  const historyRecoveries = liveChat.match(/await replaceRejectedSessionId\(sessionId, res\)/g) ?? [];
  assert.equal(historyRecoveries.length, 2, 'initial history load and polling');
});
