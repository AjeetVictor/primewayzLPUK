/** Shared 4:3 artwork ratio for outcome pillar card visuals */
export const OUTCOME_PILLAR_IMAGE_ASPECT = 'aspect-[4/3]';

export const outcomePillarImages = {
  visibility: {
    basePath: '/images/visibility',
    width: 1448,
    height: 1086,
    alt: 'Illustration showing website visibility through search, indexing and content readiness',
  },
  trust: {
    basePath: '/images/trust',
    width: 1448,
    height: 1086,
    alt: 'Illustration showing trust signals such as security, verification and social proof',
  },
  enquiries: {
    basePath: '/images/crmjourney',
    width: 1466,
    height: 1087,
    alt: 'Illustration showing enquiry capture, CRM handoff and follow-up workflow',
  },
} as const;
