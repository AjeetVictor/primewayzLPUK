import { ADMIN_TENANT_FILTER_OPTIONS } from '../../lib/platform/tenantRegistry';

type AdminTenantFilterProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function AdminTenantFilter({ value, onChange, className = '' }: AdminTenantFilterProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Filter by Primewayz entity"
      className={className || 'rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700'}
    >
      {ADMIN_TENANT_FILTER_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
