export type ScoreBand = {
  min: number;
  max: number;
  label: string;
  helper: string;
  mainColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
};

export type DisplayBand = Pick<ScoreBand, 'label' | 'mainColor' | 'textColor' | 'bgColor' | 'borderColor'>;

const SCORE_BAND_DEFINITIONS: ScoreBand[] = [
  {
    min: 80,
    max: 100,
    label: 'Strong visible web foundation',
    helper: 'Strong visible signals were found in audited pages.',
    mainColor: '#10B981',
    textColor: '#047857',
    bgColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  {
    min: 60,
    max: 79,
    label: 'Workable visible web presence',
    helper: 'A useful base is visible, with improvement opportunities.',
    mainColor: '#2563EB',
    textColor: '#1D4ED8',
    bgColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  {
    min: 40,
    max: 59,
    label: 'Visible signals need strengthening',
    helper: 'Several visible signals could be improved.',
    mainColor: '#F59E0B',
    textColor: '#92400E',
    bgColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  {
    min: 0,
    max: 39,
    label: 'Limited visible signals detected',
    helper: 'Urgent review suggested based on audited page signals.',
    mainColor: '#DC2626',
    textColor: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
];

const CATEGORY_LABEL_BY_MIN: Record<number, string> = {
  0: 'Limited signals detected',
  40: 'Needs strengthening',
  60: 'Useful signals detected',
  80: 'Strong signals detected',
};

const NOT_VERIFIED_BAND: DisplayBand = {
  label: 'Not verified in this free audit',
  mainColor: '#64748B',
  textColor: '#475569',
  bgColor: '#F8FAFC',
  borderColor: '#CBD5E1',
};

export const SCORE_BANDS_HIGH_TO_LOW = SCORE_BAND_DEFINITIONS;

export function normalizeScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
}

export function getScoreBand(score: number): ScoreBand {
  const normalized = normalizeScore(score);
  if (normalized >= 80) return SCORE_BAND_DEFINITIONS[0];
  if (normalized >= 60) return SCORE_BAND_DEFINITIONS[1];
  if (normalized >= 40) return SCORE_BAND_DEFINITIONS[2];
  return SCORE_BAND_DEFINITIONS[3];
}

export function formatScoreBandRange(band: ScoreBand): string {
  return `${band.min}–${band.max}`;
}

export function getCategoryBand(percent: number, status?: string): DisplayBand {
  if (status === 'not_verified') return NOT_VERIFIED_BAND;

  const band = getScoreBand(percent);
  return {
    label: CATEGORY_LABEL_BY_MIN[band.min] ?? band.label,
    mainColor: band.mainColor,
    textColor: band.textColor,
    bgColor: band.bgColor,
    borderColor: band.borderColor,
  };
}

export function summaryForScore(score: number): string {
  if (score >= 80) {
    return 'Strong visible website signals were detected across the audited pages, with a few areas that may still benefit from review.';
  }
  if (score >= 40) {
    return 'Several useful website signals were detected, with areas that could be strengthened based on the crawled pages.';
  }
  return 'Limited visible signals were detected across several audited categories. This highlights areas to review, but does not confirm absence across external platforms or tools.';
}
