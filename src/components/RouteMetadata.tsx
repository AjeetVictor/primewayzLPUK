import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyRouteMetadataSnapshot } from '../lib/seo/routeMetadataDom';
import { resolveRouteMetadataSnapshot } from '../lib/seo/routeMetadataHelpers';

export function RouteMetadata() {
  const location = useLocation();

  useEffect(() => {
    const snapshot = resolveRouteMetadataSnapshot(location.pathname);

    if (!snapshot) return;

    applyRouteMetadataSnapshot(snapshot);
  }, [location.pathname]);

  return null;
}
