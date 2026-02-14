import {useState, useCallback, useEffect} from 'react';
import {storageService, STORAGE_KEYS} from '../services/storageService';

export const useHaptics = () => {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const loadPreference = async () => {
      const saved = await storageService.getItem<boolean>(
        STORAGE_KEYS.HAPTICS_ENABLED,
      );
      if (saved !== null) {
        setIsEnabled(saved);
      }
    };
    loadPreference();
  }, []);

  const setHapticsEnabled = useCallback(async (enabled: boolean) => {
    setIsEnabled(enabled);
    await storageService.setItem(STORAGE_KEYS.HAPTICS_ENABLED, enabled);
  }, []);

  return {
    hapticsEnabled: isEnabled,
    setHapticsEnabled,
  };
};
