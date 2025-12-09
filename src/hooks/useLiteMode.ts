import { useState, useEffect } from 'react';

const LITE_MODE_KEY = 'ktm-lite-mode';

export const useLiteMode = () => {
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    const electronDetected = !!(window as any).electronAPI;
    setIsElectron(electronDetected);

    if (electronDetected) {
      // Check saved preference, default to true (enabled)
      const savedPreference = localStorage.getItem(LITE_MODE_KEY);
      const shouldEnable = savedPreference === null ? true : savedPreference === 'true';
      setIsLiteMode(shouldEnable);
      
      if (shouldEnable) {
        document.documentElement.classList.add('lite-mode');
        document.body.classList.add('lite-mode');
      }
    }
  }, []);

  const toggleLiteMode = (enabled: boolean) => {
    setIsLiteMode(enabled);
    localStorage.setItem(LITE_MODE_KEY, String(enabled));
    
    if (enabled) {
      document.documentElement.classList.add('lite-mode');
      document.body.classList.add('lite-mode');
    } else {
      document.documentElement.classList.remove('lite-mode');
      document.body.classList.remove('lite-mode');
    }
  };

  return { isLiteMode, isElectron, toggleLiteMode };
};

export default useLiteMode;
