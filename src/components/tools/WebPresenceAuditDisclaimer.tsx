import { AlertTriangle } from 'lucide-react';
import { AUDIT_FULL_DISCLAIMER, AUDIT_SHARE_SHORT_DISCLAIMER } from '../../lib/audit/share/disclaimers';

type WebPresenceAuditDisclaimerProps = {
  compact?: boolean;
};

export function WebPresenceAuditDisclaimer({ compact = false }: WebPresenceAuditDisclaimerProps) {
  const paragraphs = compact
    ? [AUDIT_SHARE_SHORT_DISCLAIMER]
    : AUDIT_FULL_DISCLAIMER.split('\n\n').filter(Boolean);

  return (
    <section
      className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6"
      role="note"
      aria-label="Important disclaimer"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-amber-900">
            Important disclaimer
          </h3>
          <div className={`space-y-3 text-sm leading-7 text-slate-700 ${compact ? 'mt-2' : 'mt-4'}`}>
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
