import { useState, useEffect } from 'react';

const LITE_MODE_KEY = 'ktm-lite-mode';

// Check if running in Electron
const checkIsElectron = () => !!(window as any).electronAPI;

// Get saved lite mode preference
const getSavedLiteMode = () => {
  if (!checkIsElectron()) return false;
  const saved = localStorage.getItem(LITE_MODE_KEY);
  // Default to true (enabled) for Electron
  return saved === null ? true : saved === 'true';
};

export const useLiteMode = () => {
  const [isElectron] = useState(checkIsElectron);
  const [isLiteMode, setIsLiteMode] = useState(getSavedLiteMode);

  // No longer need to add CSS classes - we use separate pages instead
  useEffect(() => {
    // Just ensure the state is correct on mount
    if (!isElectron) {
      setIsLiteMode(false);
    }
  }, [isElectron]);

  const toggleLiteMode = (enabled: boolean) => {
    setIsLiteMode(enabled);
    localStorage.setItem(LITE_MODE_KEY, String(enabled));
    // Force page reload to switch between lite/regular pages
    window.location.reload();
  };

  return { isLiteMode, isElectron, toggleLiteMode };
};

export default useLiteMode;