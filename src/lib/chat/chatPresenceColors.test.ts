import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import {
  ADMIN_AVAILABILITY_LABELS,
  CHAT_PRESENCE_COLORS,
  CHAT_PRESENCE_DOT_CLASS,
  contrastRatio,
  formatAdminAvailabilityLabel,
  formatOperationalTeamPresenceLabel,
  OPERATIONAL_TEAM_PRESENCE_LABELS,
  PRESENCE_DOT_MIN_CONTRAST,
  PRESENCE_DOT_SURFACES,
  presenceDotMeetsContrast,
  resolveAdminAvailabilityDotClass,
  resolveChatAvailabilityPresenceColor,
  resolveOperationalTeamPresenceColor,
} from './chatPresenceColors.ts';
import {
  resolveVisitorHeaderStatus,
  resolveVisitorPresenceTone,
  VISITOR_HEADER_STATUS_DOT_CLASS,
  VISITOR_HEADER_STATUS_LABELS,
  VISITOR_PRESENCE_DOT_CLASS,
  VISITOR_PRESENCE_STATUS_LABELS,
} from './visitorChatUi.ts';

const ROOT = path.resolve(import.meta.dirname, '../../..');

function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

describe('PW-CHAT-PRESENCE-02 colour tokens', () => {
  test('canonical hex values match the unified presence palette', () => {
    assert.equal(CHAT_PRESENCE_COLORS.online, '#16A34A');
    assert.equal(CHAT_PRESENCE_COLORS.away, '#F59E0B');
    assert.equal(CHAT_PRESENCE_COLORS.offline, '#94A3B8');
    assert.equal(CHAT_PRESENCE_COLORS.automated, '#0284C7');
    assert.equal(CHAT_PRESENCE_COLORS.unavailable, '#DC2626');
  });

  test('Tailwind presence classes use exact hexes and never emerald/indigo aliases', () => {
    assert.equal(CHAT_PRESENCE_DOT_CLASS.online, 'bg-[#16A34A]');
    assert.equal(CHAT_PRESENCE_DOT_CLASS.away, 'bg-[#F59E0B]');
    assert.equal(CHAT_PRESENCE_DOT_CLASS.offline, 'bg-[#94A3B8]');
    assert.equal(CHAT_PRESENCE_DOT_CLASS.automated, 'bg-[#0284C7]');
    assert.equal(CHAT_PRESENCE_DOT_CLASS.unavailable, 'bg-[#DC2626]');
    for (const className of Object.values(CHAT_PRESENCE_DOT_CLASS)) {
      assert.doesNotMatch(className, /emerald|indigo|green-500|slate|zinc/);
    }
  });

  test('availability and operational team status map to the same colour semantics', () => {
    assert.equal(resolveChatAvailabilityPresenceColor('online'), 'online');
    assert.equal(resolveChatAvailabilityPresenceColor('away'), 'away');
    assert.equal(resolveChatAvailabilityPresenceColor('offline'), 'offline');
    assert.equal(resolveChatAvailabilityPresenceColor('assistant'), 'automated');

    assert.equal(resolveOperationalTeamPresenceColor('available'), 'online');
    assert.equal(resolveOperationalTeamPresenceColor('away'), 'away');
    assert.equal(resolveOperationalTeamPresenceColor('offline'), 'offline');
    // not_online === confirmed assistant (auto, no human) — blue only for that state
    assert.equal(resolveOperationalTeamPresenceColor('not_online'), 'automated');
    assert.equal(OPERATIONAL_TEAM_PRESENCE_LABELS.not_online, 'Automated assistance');
    assert.equal(formatOperationalTeamPresenceLabel('not_online'), 'Automated assistance');
    assert.notEqual(formatOperationalTeamPresenceLabel('not_online'), 'Offline');
    assert.equal(formatOperationalTeamPresenceLabel('offline'), 'Offline');
  });

  test('unknown and empty statuses never paint as automated blue', () => {
    assert.equal(resolveChatAvailabilityPresenceColor('loading'), 'offline');
    assert.equal(resolveChatAvailabilityPresenceColor(undefined), 'offline');
    assert.equal(resolveChatAvailabilityPresenceColor(''), 'offline');
    assert.equal(resolveChatAvailabilityPresenceColor('bogus'), 'offline');
    assert.equal(resolveOperationalTeamPresenceColor(undefined), 'offline');
    assert.equal(resolveOperationalTeamPresenceColor(''), 'offline');
    assert.equal(resolveOperationalTeamPresenceColor('unknown'), 'offline');
    assert.equal(resolveOperationalTeamPresenceColor('unavailable'), 'offline');
    assert.notEqual(resolveOperationalTeamPresenceColor(null), 'automated');
  });

  test('admin labels use accessible terminology (not raw enum tokens)', () => {
    assert.equal(formatAdminAvailabilityLabel('online'), 'Online');
    assert.equal(formatAdminAvailabilityLabel('away'), 'Away');
    assert.equal(formatAdminAvailabilityLabel('offline'), 'Offline');
    assert.equal(formatAdminAvailabilityLabel('assistant'), 'Automated assistance');
    assert.equal(formatAdminAvailabilityLabel(undefined), 'Loading');
    assert.equal(ADMIN_AVAILABILITY_LABELS.assistant, 'Automated assistance');
    assert.equal(resolveAdminAvailabilityDotClass('online'), CHAT_PRESENCE_DOT_CLASS.online);
    assert.equal(resolveAdminAvailabilityDotClass('assistant'), CHAT_PRESENCE_DOT_CLASS.automated);
  });

  test('presence dots meet 3:1 on dark header; light-surface meaning uses text labels', () => {
    // Chat header / navy chrome (hosted + embed).
    for (const key of Object.keys(CHAT_PRESENCE_COLORS) as Array<keyof typeof CHAT_PRESENCE_COLORS>) {
      assert.ok(
        presenceDotMeetsContrast(key, PRESENCE_DOT_SURFACES.darkHeader),
        `${key} vs dark header`,
      );
    }
    // Admin banner (white): stronger greens/blues/reds clear 3:1.
    assert.ok(presenceDotMeetsContrast('online', PRESENCE_DOT_SURFACES.light));
    assert.ok(presenceDotMeetsContrast('automated', PRESENCE_DOT_SURFACES.light));
    assert.ok(presenceDotMeetsContrast('unavailable', PRESENCE_DOT_SURFACES.light));
    // Ticket hexes for away (#F59E0B) and offline (#94A3B8) are intentionally lighter on white;
    // adjacent text labels (formatAdminAvailabilityLabel / VISITOR_*_LABELS) carry meaning.
    assert.ok(
      contrastRatio(CHAT_PRESENCE_COLORS.away, PRESENCE_DOT_SURFACES.light)
        < PRESENCE_DOT_MIN_CONTRAST,
    );
    assert.ok(
      contrastRatio(CHAT_PRESENCE_COLORS.offline, PRESENCE_DOT_SURFACES.light)
        < PRESENCE_DOT_MIN_CONTRAST,
    );
    assert.ok(ADMIN_AVAILABILITY_LABELS.away.length > 0);
    assert.ok(ADMIN_AVAILABILITY_LABELS.offline.length > 0);
    assert.ok(VISITOR_PRESENCE_STATUS_LABELS.away.length > 0);
    assert.ok(VISITOR_PRESENCE_STATUS_LABELS.offline.length > 0);
  });
});

describe('PW-CHAT-PRESENCE-02 visitor presence mapping', () => {
  test('offline is grey and distinct from away amber and automated blue', () => {
    assert.equal(
      resolveVisitorPresenceTone({ availabilityStatus: 'offline', serviceAvailable: true }),
      'offline',
    );
    assert.equal(VISITOR_PRESENCE_DOT_CLASS.offline, CHAT_PRESENCE_DOT_CLASS.offline);
    assert.equal(VISITOR_PRESENCE_DOT_CLASS.away, CHAT_PRESENCE_DOT_CLASS.away);
    assert.equal(VISITOR_PRESENCE_DOT_CLASS.automated, CHAT_PRESENCE_DOT_CLASS.automated);
    assert.match(VISITOR_PRESENCE_DOT_CLASS.automated, /#0284C7/);
    assert.doesNotMatch(VISITOR_PRESENCE_DOT_CLASS.automated, /slate|gray|grey|#94A3B8/i);
    assert.equal(VISITOR_PRESENCE_STATUS_LABELS.offline, 'Team offline');
    assert.equal(
      resolveVisitorHeaderStatus({
        availabilityStatus: 'offline',
        hasAdminReply: false,
        waitingForTeam: false,
        serviceAvailable: true,
      }),
      'team_offline',
    );
    assert.equal(VISITOR_HEADER_STATUS_LABELS.team_offline, 'Team offline');
    assert.equal(VISITOR_HEADER_STATUS_DOT_CLASS.team_offline, CHAT_PRESENCE_DOT_CLASS.offline);
  });

  test('online avoids theme-remapped emerald (brand blue)', () => {
    assert.match(VISITOR_PRESENCE_DOT_CLASS.online, /#16A34A/);
    assert.doesNotMatch(VISITOR_PRESENCE_DOT_CLASS.online, /emerald|1B59A7|blue/i);
    const theme = read('src/index.css');
    assert.match(theme, /--color-emerald-500:\s*#1B59A7/);
    const admin = read('src/components/AdminPanel.tsx');
    assert.match(admin, /resolveAdminAvailabilityDotClass/);
    assert.doesNotMatch(admin, /availabilityDotClass[\s\S]{0,200}bg-emerald-500/);
  });
});

describe('PW-CHAT-PRESENCE-02 embed CSS alignment', () => {
  test('embed tone classes use the unified hex palette and include offline', () => {
    const styles = read('src/embed/chat/styles.ts');
    assert.match(styles, /\.pw-chat-tone-online\s*\{\s*background:\s*#16A34A\s*;/);
    assert.match(styles, /\.pw-chat-tone-away\s*\{\s*background:\s*#F59E0B\s*;/);
    assert.match(styles, /\.pw-chat-tone-offline\s*\{\s*background:\s*#94A3B8\s*;/);
    assert.match(styles, /\.pw-chat-tone-automated\s*\{\s*background:\s*#0284C7\s*;/);
    assert.match(styles, /\.pw-chat-tone-unavailable\s*\{\s*background:\s*#DC2626\s*;/);
  });
});
