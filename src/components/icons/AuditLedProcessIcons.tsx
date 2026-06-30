type AuditIconProps = {
  className?: string;
};

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
} as const;

export function ReviewAuditIcon({ className }: AuditIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path {...iconProps} d="M22 12h20" />
      <path {...iconProps} d="M25 8h14l2 6H23z" />
      <path {...iconProps} d="M18 14H12v38h28" />
      <path {...iconProps} d="M46 14h6v18" />
      <path {...iconProps} d="m18 25 3 3 5-6" />
      <path {...iconProps} d="M31 26h10" />
      <path {...iconProps} d="m18 36 3 3 5-6" />
      <path {...iconProps} d="M31 37h6" />
      <circle {...iconProps} cx="43" cy="42" r="10" />
      <path {...iconProps} d="m50.5 49.5 7 7" />
    </svg>
  );
}

export function PrioritiseAuditIcon({ className }: AuditIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path {...iconProps} d="M23 12h18" />
      <path {...iconProps} d="M26 8h12l2 6H24z" />
      <path {...iconProps} d="M17 14H12v42h40V14h-5" />
      <path {...iconProps} d="m20 27 3 3 6-7" />
      <path {...iconProps} d="M34 27h9" />
      <path {...iconProps} d="m20 39 3 3 6-7" />
      <path {...iconProps} d="M34 39h9" />
      <path {...iconProps} d="m20 51 3 3 6-7" />
      <path {...iconProps} d="M34 51h9" />
    </svg>
  );
}

export function ImproveAuditIcon({ className }: AuditIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path {...iconProps} d="M9 14h42a4 4 0 0 1 4 4v27a4 4 0 0 1-4 4H9z" />
      <path {...iconProps} d="M9 24h46" />
      <path {...iconProps} d="M16 19h.1" />
      <path {...iconProps} d="M23 19h.1" />
      <path {...iconProps} d="M39 35.5a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
      <path {...iconProps} d="M39 31v4.5" />
      <path {...iconProps} d="M39 53.5V58" />
      <path {...iconProps} d="M52.5 44.5H57" />
      <path {...iconProps} d="M21 44.5h9" />
      <path {...iconProps} d="m48.5 35 3-3" />
      <path {...iconProps} d="m26.5 57 3-3" />
      <path {...iconProps} d="m48.5 54 3 3" />
      <path {...iconProps} d="m26.5 32 3 3" />
      <circle {...iconProps} cx="39" cy="44.5" r="3.5" />
    </svg>
  );
}

export function TrackAuditIcon({ className }: AuditIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path {...iconProps} d="M10 52h44" />
      <path {...iconProps} d="M14 39h8v13h-8z" />
      <path {...iconProps} d="M28 31h8v21h-8z" />
      <path {...iconProps} d="M42 23h8v29h-8z" />
      <path {...iconProps} d="m14 27 10-8 10 7 15-16" />
      <circle {...iconProps} cx="14" cy="27" r="2.5" />
      <circle {...iconProps} cx="24" cy="19" r="2.5" />
      <circle {...iconProps} cx="34" cy="26" r="2.5" />
      <circle {...iconProps} cx="49" cy="10" r="2.5" />
    </svg>
  );
}
