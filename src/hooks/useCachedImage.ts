import { useState, useEffect, useRef } from 'react';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

// In-memory cache to avoid repeated IPC calls
const imageCache = new Map<string, string>();

export const useCachedImage = (gameId: string, imageUrl: string) => {
  const [cachedSrc, setCachedSrc] = useState<string>(() => {
    // Check memory cache first
    if (isElectron && imageCache.has(gameId)) {
      return imageCache.get(gameId)!;
    }
    return imageUrl;
  });
  const [isLoading, setIsLoading] = useState(() => {
    // Not loading if already in memory cache
    return isElectron && !imageCache.has(gameId);
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    // If not electron or already cached in memory, skip
    if (!isElectron || !gameId || !imageUrl) {
      setCachedSrc(imageUrl);
      setIsLoading(false);
      return;
    }

    // Already in memory cache
    if (imageCache.has(gameId)) {
      setCachedSrc(imageCache.get(gameId)!);
      setIsLoading(false);
      return;
    }

    const loadCachedImage = async () => {
      try {
        const electronAPI = (window as any).electronAPI;
        
        // First check if image is already cached locally
        const cached = await electronAPI.getCachedImage(gameId);
        
        if (cached.success && cached.dataUrl) {
          imageCache.set(gameId, cached.dataUrl);
          if (mounted.current) {
            setCachedSrc(cached.dataUrl);
            setIsLoading(false);
          }
          return;
        }
        
        // Not cached, download and cache it
        const result = await electronAPI.cacheGameImage({ gameId, imageUrl });
        
        if (result.success && result.dataUrl) {
          imageCache.set(gameId, result.dataUrl);
          if (mounted.current) {
            setCachedSrc(result.dataUrl);
          }
        } else {
          // Fallback to original URL
          if (mounted.current) {
            setCachedSrc(imageUrl);
          }
        }
      } catch (err) {
        console.error('Image caching error:', err);
        if (mounted.current) {
          setCachedSrc(imageUrl);
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadCachedImage();
  }, [gameId, imageUrl]);

  return { cachedSrc, isLoading };
};

// Export function to clear memory cache when clearing disk cache
export const clearImageMemoryCache = () => {
  imageCache.clear();
};
