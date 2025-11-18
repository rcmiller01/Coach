import { useState } from 'react';

/**
 * PwaInstallHint - Small banner suggesting PWA installation
 * 
 * Shows only on mobile browsers and can be dismissed.
 * Detects platform (iOS/Android) and shows appropriate hint.
 */
/**
 * PwaInstallHint - Small banner suggesting PWA installation
 * 
 * Shows only on mobile browsers and can be dismissed.
 * Detects platform (iOS/Android) and shows appropriate hint.
 */
export function PwaInstallHint() {
  // Detect platform and visibility on mount
  const getInitialState = () => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-hint-dismissed');
    if (dismissed) return { visible: false, platform: null };

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Don't show if already installed as PWA
    if (isStandalone) return { visible: false, platform: null };

    // Only show on mobile
    if (isIOS) {
      return { visible: true, platform: 'ios' as const };
    } else if (isAndroid) {
      return { visible: true, platform: 'android' as const };
    }

    return { visible: false, platform: null };
  };

  const [state, setState] = useState(getInitialState);

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-hint-dismissed', 'true');
    setState({ visible: false, platform: null });
  };

  if (!state.visible || !state.platform) return null;

  const hints: Record<'ios' | 'android', string> = {
    ios: 'Tap Share → "Add to Home Screen" to install as an app',
    android: 'Install as app from browser menu for full-screen experience',
  };

  return (
    <div className="bg-blue-600 text-white px-3 py-2 text-sm flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span>📱</span>
        <span>{hints[state.platform]}</span>
      </div>
      <button
        onClick={handleDismiss}
        className="text-white/80 hover:text-white font-bold px-2"
      >
        ✕
      </button>
    </div>
  );
}
