import { ADMIN_TENANT_FILTER_OPTIONS } from '../../lib/platform/tenantRegistry';

type AdminTenantFilterProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  tenantIds?: readonly string[];
  isPlatformOwner?: boolean;
};

export function AdminTenantFilter({
  value,
  onChange,
  className = '',
  tenantIds,
  isPlatformOwner = true,
}: AdminTenantFilterProps) {
  const options = ADMIN_TENANT_FILTER_OPTIONS.filter((option) =>
    option.value === 'all'
      ? isPlatformOwner
      : tenantIds === undefined || isPlatformOwner || tenantIds.includes(option.value),
  );

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Filter by Primewayz entity"
      className={className || 'rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700'}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
