import type { SuccessStoryEvidence } from '../../data/successStories';

export function EvidenceDisclosure({ evidence }: { evidence: SuccessStoryEvidence }) {
  return (
    <section className="bg-slate-50 px-6 py-16 lg:px-8" aria-labelledby="evidence-basis-heading">
      <div className="mx-auto max-w-[1200px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          Evidence governance
        </p>
        <h2 id="evidence-basis-heading" className="mt-3 text-2xl font-black tracking-tight text-[#000A2D]">
          Evidence basis and limitations
        </h2>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="font-bold text-slate-950">Basis for this story</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{evidence.basis}</p>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Visual provenance
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {evidence.visualProvenance.disclosure}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-950">What this story does not claim</h3>
            <ul className="mt-2 space-y-3">
              {evidence.limitations.map((limitation) => (
                <li key={limitation} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                  {limitation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
