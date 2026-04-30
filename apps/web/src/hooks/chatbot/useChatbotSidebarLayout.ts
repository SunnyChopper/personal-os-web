import { useEffect, useState } from 'react';

const LG_BREAKPOINT_PX = 1024;

export function useChatbotSidebarLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= LG_BREAKPOINT_PX) {
        setSidebarCollapsed(false);
      } else {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { sidebarCollapsed, setSidebarCollapsed };
}
