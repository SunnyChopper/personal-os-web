import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageview } from '@/lib/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const url = location.pathname + location.search + location.hash;
    pageview(url);
  }, [location]);
};
