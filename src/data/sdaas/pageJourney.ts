/** Narrative journey steps connecting SDaaS page sections into one continuous story. */
export const SDAAS_JOURNEY_STEPS = [
  { step: 1, label: 'Business chaos' },
  { step: 2, label: 'Need for structure' },
  { step: 3, label: 'What SDaaS is' },
  { step: 4, label: 'Who it helps' },
  { step: 5, label: 'What can be delivered' },
  { step: 6, label: 'How delivery works' },
  { step: 7, label: 'How capacity works' },
  { step: 8, label: 'Why this model fits' },
  { step: 9, label: 'Trust' },
  { step: 10, label: 'Onboarding' },
  { step: 11, label: 'Request capacity' },
] as const;

export const SDAAS_SECTION_TRANSITIONS = {
  definition:
    'Once the problem is clear, the next question is what a subscription model actually means in practice.',
  audience:
    'Understanding the model is only useful if it fits your situation. The next step is identifying who benefits most.',
  deliverables:
    'With the right audience in mind, the next question is what monthly capacity can realistically deliver.',
  process:
    'Knowing what can be delivered still leaves one practical question: how work actually moves through the month.',
  capacity:
    'A delivery process only works when capacity is visible. The next section explains how monthly allocation is managed.',
  fit:
    'Capacity management explains how work progresses. The next question is whether this model is the right fit for your situation.',
  comparison:
    'If the model could fit, it helps to compare it honestly with the alternatives businesses usually consider.',
  trust:
    'Commercial models only work when delivery is responsible. Ownership, access and visibility matter as much as capacity.',
  onboarding:
    'When the model feels credible, the practical question becomes how a subscription actually starts.',
  pricing:
    'After onboarding is clear, the remaining question is what level of capacity your workload likely needs.',
  faq:
    'If you still have questions, these are the ones UK buyers most often ask before requesting a capacity recommendation.',
  finalCta:
    'If the model could fit your backlog, the final step is a practical conversation about capacity—not a sales pitch.',
} as const;
