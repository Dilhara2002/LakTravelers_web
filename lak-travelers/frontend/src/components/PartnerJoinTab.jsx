import { Link, useLocation } from 'react-router-dom';

export default function PartnerJoinTab() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/partners') ||
      pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <Link
      to="/partners"
      className="lt-partner-join-tab"
      aria-label="Join LakTravelers as a partner"
    >
      <span>Join as Partner</span>
    </Link>
  );
}
