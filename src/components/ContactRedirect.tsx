import { Navigate, useLocation } from 'react-router-dom';

export function ContactRedirect() {
  const location = useLocation();
  return <Navigate to={`/contact-us${location.search}${location.hash}`} replace />;
}
