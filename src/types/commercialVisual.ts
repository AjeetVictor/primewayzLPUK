/** Shared commercial page image asset — reusable across content clusters. */
export type CommercialImageAsset = {
  slug: string;
  basePath: string;
  name: string;
  description: string;
  alt: string;
  width: number;
  height: number;
  clusterReuse?: boolean;
};

export const COMMERCIAL_RESPONSIVE_SIZES =
  '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px';
