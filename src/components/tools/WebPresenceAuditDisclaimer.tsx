import { AlertTriangle } from 'lucide-react';
import { AUDIT_FULL_DISCLAIMER } from '../../lib/audit/share/disclaimers';

type WebPresenceAuditDisclaimerProps = {
  variant?: 'default' | 'prominent';
};

export function WebPresenceAuditDisclaimer({ variant = 'default' }: WebPresenceAuditDisclaimerProps) {
  const paragraphs = AUDIT_FULL_DISCLAIMER.split('\n\n').filter(Boolean);

  if (variant === 'prominent') {
    return (
      <section
        className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 sm:p-7"
        aria-label="Audit disclaimer"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="space-y-4 text-sm leading-7 text-slate-700">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
      aria-label="Audit disclaimer"
    >
      <div className="space-y-3 text-sm leading-7 text-slate-600">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
