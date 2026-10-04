/**
 * Widget styles, injected into the shadow root only. Hosts may override the
 * --pw-chat-* custom properties (and --pw-font) on #pw-chat-root.
 */

export const PW_CHAT_STYLES = `
:host {
  --pw-chat-navy: #071b3a;
  --pw-chat-navy-deep: #082445;
  --pw-chat-action: #0877df;
  --pw-chat-action-hover: #0b68d1;
  --pw-chat-accent: #51b4dd;
  --pw-chat-surface: #f5f9ff;
  --pw-chat-surface-alt: #f7fbff;
  --pw-chat-border: #cbd7e6;
  --pw-chat-border-soft: #d9e8f8;
  --pw-chat-muted: #4a5d78;
  --pw-chat-error: #b42318;
  --pw-chat-z: 10000;
  --pw-chat-bottom: 18px;
}
*, *::before, *::after { box-sizing: border-box; }
.pw-chat-root {
  font-family: var(--pw-font, "Mulish", Arial, sans-serif);
  font-size: 15px;
  line-height: 1.45;
  color: var(--pw-chat-navy);
  -webkit-font-smoothing: antialiased;
}
button, textarea, input { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 2px solid var(--pw-chat-action); outline-offset: 2px; }
.pw-chat-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

.pw-chat-launcher {
  position: fixed; right: 18px; bottom: var(--pw-chat-bottom); z-index: var(--pw-chat-z);
  width: 56px; height: 56px; border-radius: 50%;
  border: 2px solid #ffffff; background: var(--pw-chat-navy); color: #ffffff;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 24px rgba(7, 27, 58, 0.28);
  transition: background-color 150ms ease;
}
.pw-chat-launcher:hover { background: var(--pw-chat-navy-deep); }
.pw-chat-launcher[hidden] { display: none; }
.pw-chat-launcher svg { width: 26px; height: 26px; }
.pw-chat-launcher-dot {
  position: absolute; right: 3px; top: 3px; width: 12px; height: 12px;
  border-radius: 50%; border: 2px solid #ffffff; background: #94a3b8;
}
.pw-chat-badge {
  position: absolute; left: -4px; top: -4px; min-width: 20px; height: 20px; padding: 0 5px;
  border-radius: 10px; background: var(--pw-chat-action); color: #ffffff;
  font-size: 12px; font-weight: 700; line-height: 20px; text-align: center;
}
.pw-chat-badge[hidden] { display: none; }
.pw-chat-tone-online { background: #16a34a; }
.pw-chat-tone-away { background: #d97706; }
.pw-chat-tone-automated { background: var(--pw-chat-accent); }
.pw-chat-tone-unavailable { background: var(--pw-chat-error); }

.pw-chat-panel {
  position: fixed; right: 18px; bottom: var(--pw-chat-bottom); z-index: var(--pw-chat-z);
  width: min(400px, calc(100vw - 36px));
  height: min(620px, calc(100vh - var(--pw-chat-bottom) - 24px));
  display: flex; flex-direction: column; overflow: hidden;
  background: #ffffff; border: 1px solid var(--pw-chat-border); border-radius: 14px;
  box-shadow: 0 24px 60px rgba(7, 27, 58, 0.22);
  transform-origin: bottom right;
  animation: pw-chat-open 160ms ease-out;
}
.pw-chat-panel[hidden] { display: none; }
@keyframes pw-chat-open {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: none; }
}

.pw-chat-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 14px 14px 18px; background: var(--pw-chat-navy-deep); color: #ffffff;
}
.pw-chat-heading { flex: 1; min-width: 0; }
.pw-chat-title { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 0.01em; }
.pw-chat-status { display: flex; align-items: center; gap: 6px; margin-top: 2px; font-size: 13px; color: #c9d8ec; }
.pw-chat-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; flex: none; }
.pw-chat-close {
  width: 40px; height: 40px; flex: none; border: 0; border-radius: 8px;
  background: transparent; color: #ffffff; font-size: 24px; line-height: 1;
}
.pw-chat-close:hover { background: rgba(255, 255, 255, 0.12); }

.pw-chat-log {
  flex: 1; overflow-y: auto; overscroll-behavior: contain;
  padding: 18px; background: var(--pw-chat-surface-alt);
  display: flex; flex-direction: column; gap: 12px;
}
.pw-chat-intro { padding-bottom: 6px; border-bottom: 1px solid var(--pw-chat-border-soft); }
.pw-chat-intro-greeting { margin: 0 0 4px; font-size: 17px; font-weight: 800; color: var(--pw-chat-navy); }
.pw-chat-intro-text { margin: 0 0 10px; color: var(--pw-chat-muted); }
.pw-chat-expectation { margin: 0 0 10px; font-size: 13px; color: var(--pw-chat-muted); }
.pw-chat-intents { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.pw-chat-intent {
  text-align: left; padding: 9px 12px; min-height: 40px;
  border: 1px solid var(--pw-chat-border); border-radius: 8px; background: #ffffff;
}
.pw-chat-intent:hover, .pw-chat-intent[aria-pressed="true"] {
  border-color: var(--pw-chat-action); color: var(--pw-chat-action);
}

.pw-chat-msg { max-width: 86%; display: flex; flex-direction: column; gap: 3px; }
.pw-chat-msg-label { font-size: 12px; font-weight: 700; color: var(--pw-chat-muted); }
.pw-chat-msg-text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.pw-chat-msg--user { align-self: flex-end; align-items: flex-end; }
.pw-chat-msg--user .pw-chat-msg-text {
  padding: 9px 13px; border-radius: 14px 14px 4px 14px;
  background: var(--pw-chat-action); color: #ffffff;
}
.pw-chat-msg--bot .pw-chat-msg-text {
  padding: 9px 13px; border-radius: 14px 14px 14px 4px;
  background: #ffffff; border: 1px solid var(--pw-chat-border-soft);
}
.pw-chat-msg--admin .pw-chat-msg-text {
  padding: 9px 13px; background: var(--pw-chat-surface);
  border-left: 3px solid var(--pw-chat-accent); border-radius: 2px 10px 10px 2px;
}
.pw-chat-msg--admin .pw-chat-msg-label { color: var(--pw-chat-navy); }
.pw-chat-msg--system {
  align-self: center; max-width: 100%; text-align: center;
  font-size: 13px; color: var(--pw-chat-muted);
}
.pw-chat-msg-deleted { font-style: italic; color: var(--pw-chat-muted); }
.pw-chat-msg-meta { font-size: 12px; color: var(--pw-chat-muted); }

.pw-chat-lead {
  padding: 14px 18px; border-top: 1px solid var(--pw-chat-border-soft); background: #ffffff;
  display: flex; flex-direction: column; gap: 8px;
}
.pw-chat-lead[hidden] { display: none; }
.pw-chat-lead-title { margin: 0; font-weight: 700; }
.pw-chat-lead-row { display: flex; gap: 8px; }
.pw-chat-lead-row button { flex: none; }

.pw-chat-input {
  width: 100%; min-height: 40px; padding: 8px 11px;
  border: 1px solid var(--pw-chat-border); border-radius: 8px; background: #ffffff;
}
.pw-chat-input:focus { border-color: var(--pw-chat-action); outline: none; box-shadow: 0 0 0 3px rgba(8, 119, 223, 0.15); }

.pw-chat-notice {
  margin: 0; padding: 9px 18px; font-size: 13px;
  background: #fff6f5; color: var(--pw-chat-error); border-top: 1px solid #f3d0cc;
  display: flex; align-items: center; gap: 10px;
}
.pw-chat-notice[hidden] { display: none; }
.pw-chat-notice-text { flex: 1; }

.pw-chat-composer {
  display: flex; align-items: flex-end; gap: 8px; padding: 12px 14px;
  border-top: 1px solid var(--pw-chat-border-soft); background: #ffffff;
}
.pw-chat-textarea { resize: none; max-height: 120px; }

.pw-chat-btn {
  min-height: 40px; padding: 0 16px; border: 0; border-radius: 8px;
  background: var(--pw-chat-action); color: #ffffff; font-weight: 700;
}
.pw-chat-btn:hover { background: var(--pw-chat-action-hover); }
.pw-chat-btn:disabled { background: #9db8d6; cursor: not-allowed; }
.pw-chat-btn--quiet {
  background: transparent; color: var(--pw-chat-action); padding: 0 8px; text-decoration: underline;
}
.pw-chat-btn--quiet:hover { background: transparent; color: var(--pw-chat-action-hover); }

.pw-chat-booking {
  padding: 10px 18px; border-top: 1px solid var(--pw-chat-border-soft); background: var(--pw-chat-surface);
  font-size: 14px;
}
.pw-chat-booking[hidden] { display: none; }
.pw-chat-booking a { color: var(--pw-chat-action); font-weight: 700; }

@media (max-width: 1180px) {
  .pw-chat-panel { width: min(380px, calc(100vw - 36px)); }
}
@media (max-width: 1024px) {
  .pw-chat-panel { width: min(360px, calc(100vw - 36px)); height: min(560px, calc(100vh - var(--pw-chat-bottom) - 24px)); }
}
@media (max-width: 767px) {
  .pw-chat-panel {
    inset: 0; width: 100vw; height: 100dvh; max-width: none;
    border: 0; border-radius: 0; box-shadow: none;
  }
  .pw-chat-close { width: 44px; height: 44px; }
  .pw-chat-btn, .pw-chat-input, .pw-chat-intent { min-height: 44px; }
  .pw-chat-textarea { font-size: 16px; }
  .pw-chat-input { font-size: 16px; }
}
@media (max-width: 480px) {
  .pw-chat-log { padding: 14px; }
  .pw-chat-composer { padding: 10px; }
  .pw-chat-lead-row { flex-direction: column; }
  .pw-chat-msg { max-width: 92%; }
}
@media (prefers-reduced-motion: reduce) {
  .pw-chat-panel { animation: none; }
  .pw-chat-launcher { transition: none; }
}
`;
