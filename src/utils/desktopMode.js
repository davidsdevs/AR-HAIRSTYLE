/**
 * Desktop Mode Utilities
 * 
 * Helper functions and hooks for desktop/website mode optimization
 * Desktop mode: 1024px to 2159px (100vh compact)
 * Kiosk mode: 2160px+ (3180px height)
 */

import { useState, useEffect } from 'react';

/**
 * Check if current screen size is desktop mode
 * @returns {boolean}
 */
export function isDesktopMode() {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 1024 && width < 2160;
}

/**
 * Check if current screen size is kiosk mode
 * @returns {boolean}
 */
export function isKioskMode() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 2160;
}

/**
 * Check if current screen size is mobile/tablet
 * @returns {boolean}
 */
export function isMobileMode() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024;
}

/**
 * Get current viewport mode
 * @returns {'mobile' | 'desktop' | 'kiosk'}
 */
export function getViewportMode() {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width >= 2160) return 'kiosk';
  if (width >= 1024) return 'desktop';
  return 'mobile';
}

/**
 * React hook to get current viewport mode
 * @returns {'mobile' | 'desktop' | 'kiosk'}
 */
export function useViewportMode() {
  const [mode, setMode] = useState(getViewportMode());

  useEffect(() => {
    const handleResize = () => {
      setMode(getViewportMode());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return mode;
}

/**
 * React hook to check if in desktop mode
 * @returns {boolean}
 */
export function useDesktopMode() {
  const [isDesktop, setIsDesktop] = useState(isDesktopMode());

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(isDesktopMode());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
}

/**
 * Get compacted size based on mode
 * @param {number} kioskSize - Size for kiosk mode
 * @param {number} desktopSize - Size for desktop mode (default: kioskSize * 0.4)
 * @param {number} mobileSize - Size for mobile mode (default: desktopSize)
 * @returns {number}
 */
export function getCompactSize(kioskSize, desktopSize = null, mobileSize = null) {
  const mode = getViewportMode();
  const desktop = desktopSize || kioskSize * 0.4;
  const mobile = mobileSize || desktop;
  
  switch (mode) {
    case 'kiosk':
      return kioskSize;
    case 'desktop':
      return desktop;
    default:
      return mobile;
  }
}

/**
 * Get compacted spacing based on mode
 * @param {number} kioskSpacing - Spacing for kiosk mode
 * @returns {number}
 */
export function getCompactSpacing(kioskSpacing) {
  return getCompactSize(kioskSpacing, kioskSpacing * 0.5, kioskSpacing * 0.4);
}

/**
 * Get font size multiplier based on mode
 * @returns {number}
 */
export function getFontSizeMultiplier() {
  const mode = getViewportMode();
  switch (mode) {
    case 'kiosk':
      return 1.2;
    case 'desktop':
      return 0.875; // Compact for desktop
    default:
      return 1;
  }
}

/**
 * Get container max height based on mode
 * @param {number} headerHeight - Height of header
 * @returns {string}
 */
export function getContainerMaxHeight(headerHeight = 80) {
  const mode = getViewportMode();
  switch (mode) {
    case 'kiosk':
      return '3180px';
    case 'desktop':
      return `calc(100vh - ${headerHeight}px)`;
    default:
      return '100vh';
  }
}



