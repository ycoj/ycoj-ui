import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribeToViewportChange(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

function getIsMobileSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getIsMobileServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToViewportChange,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot
  );
}
