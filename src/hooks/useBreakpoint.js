import { useState, useEffect } from 'react';

const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440
};

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('mobile');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowSize({
        width,
        height: window.innerHeight,
      });

      if (width >= breakpoints.wide) {
        setBreakpoint('wide');
      } else if (width >= breakpoints.desktop) {
        setBreakpoint('desktop');
      } else if (width >= breakpoints.tablet) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('mobile');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
    isWide: breakpoint === 'wide',
    windowSize
  };
};
