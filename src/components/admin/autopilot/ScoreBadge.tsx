import { getScoreBandLabel } from '../../../lib/autopilot/adminAutopilotLabels';
import { formatScoreDisplay } from '../../../lib/autopilot/adminAutopilotPipelineHelpers';
import { getAutopilotRecommendationBand } from '../../../data/autopilot/scoringConfig';

type ScoreBadgeProps = {
  totalScore?: number | null;
  band?: string | null;
  showNumeric?: boolean;
  className?: string;
};

function toneClass(band: string | null | undefined, unscored: boolean): string {
  if (unscored) return 'bg-zinc-100 text-zinc-600 border-zinc-200';
  switch (band) {
    case 'strong_approve_candidate':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'review_carefully':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'defer_or_needs_research':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'likely_reject':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
}

export function ScoreBadge({
  totalScore,
  band,
  showNumeric = true,
  className = '',
}: ScoreBadgeProps) {
  const { scoreText } = formatScoreDisplay(totalScore, band);
  const unscored = scoreText === 'Not scored';
  // Prefer API band; otherwise map the server-computed total to established thresholds.
  const resolvedBand = unscored
    ? null
    : band ||
      (totalScore != null && Number.isFinite(Number(totalScore))
        ? getAutopilotRecommendationBand(Number(totalScore))
        : null);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${toneClass(resolvedBand, unscored)} ${className}`}
      title={
        unscored
          ? 'Not scored'
          : `${getScoreBandLabel(resolvedBand)}${showNumeric ? ` (${scoreText})` : ''}`
      }
    >
      <span className="sr-only">Score: </span>
      {unscored ? (
        'Not scored'
      ) : (
        <>
          <span className="uppercase">{getScoreBandLabel(resolvedBand)}</span>
          {showNumeric ? <span aria-hidden="true">· {scoreText}</span> : null}
          {showNumeric ? <span className="sr-only">, numeric score {scoreText}</span> : null}
        </>
      )}
    </span>
  );
}
