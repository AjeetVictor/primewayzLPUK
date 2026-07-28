type AuditIconProps = {
  className?: string;
};

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 3.15,
};

export function ReviewAuditIcon({ className }: AuditIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        {...strokeProps}
        d="M31 20H22.5A4.5 4.5 0 0 0 18 24.5v50A4.5 4.5 0 0 0 22.5 79H55"
      />
      <path {...strokeProps} d="M54 20h8.5a4.5 4.5 0 0 1 4.5 4.5V49" />
      <path {...strokeProps} d="M35 13.5h15a5 5 0 0 1 5 5v4H30v-4a5 5 0 0 1 5-5Z" />
      <path {...strokeProps} d="m27 37 4.5 4.5 8-9" />
      <path {...strokeProps} d="M46 38h11" />
      <path {...strokeProps} d="m27 54 4.5 4.5 8-9" />
      <path {...strokeProps} d="M46 55h7" />
      <circle {...strokeProps} cx="65" cy="66" r="14" />
      <path {...strokeProps} d="m75.5 76.5 10 10" />
    </svg>
  );
}

export function PrioritiseAuditIcon({ className }: AuditIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        {...strokeProps}
        d="M30 20H21.5A4.5 4.5 0 0 0 17 24.5v56A4.5 4.5 0 0 0 21.5 85h53a4.5 4.5 0 0 0 4.5-4.5v-56a4.5 4.5 0 0 0-4.5-4.5H66"
      />
      <path {...strokeProps} d="M36 13.5h24a5 5 0 0 1 5 5v5H31v-5a5 5 0 0 1 5-5Z" />
      <path {...strokeProps} d="m29 40 5 5 9-10" />
      <path {...strokeProps} d="M50 41h18" />
      <path {...strokeProps} d="m29 57 5 5 9-10" />
      <path {...strokeProps} d="M50 58h18" />
      <path {...strokeProps} d="m29 74 5 5 9-10" />
      <path {...strokeProps} d="M50 75h18" />
    </svg>
  );
}

export function ImproveAuditIcon({ className }: AuditIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect {...strokeProps} x="10" y="17" width="76" height="57" rx="6" />
      <path {...strokeProps} d="M10 30h76" />
      <circle cx="19" cy="24" r="1.8" fill="currentColor" />
      <circle cx="27" cy="24" r="1.8" fill="currentColor" />
      <circle {...strokeProps} cx="55" cy="58" r="10" />
      <path {...strokeProps} d="M55 41v6M55 69v6M38 58h6M66 58h6M43 46l4.2 4.2M62.8 65.8 67 70M67 46l-4.2 4.2M47.2 65.8 43 70" />
      <path
        {...strokeProps}
        d="m51.4 43-1.8-5.4h10.8L58.6 43M70 54.4l5.4-1.8v10.8L70 61.6M58.6 73l1.8 5.4H49.6l1.8-5.4M40 61.6l-5.4 1.8V52.6l5.4 1.8"
      />
    </svg>
  );
}

export function TrackAuditIcon({ className }: AuditIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path {...strokeProps} d="M12 82h72" />
      <path {...strokeProps} d="M20 82V63h13v19" />
      <path {...strokeProps} d="M42 82V52h13v30" />
      <path {...strokeProps} d="M64 82V38h13v44" />
      <path {...strokeProps} d="m20 47 17-14 16 10 23-26" />
      <circle {...strokeProps} cx="20" cy="47" r="4.5" />
      <circle {...strokeProps} cx="37" cy="33" r="4.5" />
      <circle {...strokeProps} cx="53" cy="43" r="4.5" />
      <circle {...strokeProps} cx="76" cy="17" r="4.5" />
    </svg>
  );
}

export function ProcessFlowConnectorIcon({ className }: AuditIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path {...strokeProps} d="M7 16h17" />
      <path {...strokeProps} d="m18 9 7 7-7 7" />
    </svg>
  );
}
