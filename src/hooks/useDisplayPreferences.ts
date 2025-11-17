import { useState, useCallback } from 'react';
import { storageService, STORAGE_KEYS } from '../services/storageService';
import { logger } from '../utils/logger';

export interface DisplayPreference {
  id: string;
  label: string;
  enabled: boolean;
  isCore?: boolean;
}

const defaultPreferences: DisplayPreference[] = [
  { id: 'image', label: 'Image', enabled: true, isCore: true },
  { id: 'name', label: 'Name', enabled: true, isCore: true },
  { id: 'quantity', label: 'Quantity', enabled: true, isCore: true },
  { id: 'location', label: 'Location', enabled: true },
  { id: 'labels', label: 'Labels', enabled: true },
  { id: 'description', label: 'Description', enabled: false },
  { id: 'purchasePrice', label: 'Purchase Price', enabled: false },
  { id: 'insured', label: 'Insured', enabled: false },
];

export const useDisplayPreferences = () => {
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreference[]>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);

  const loadDisplayPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedPreferences = await storageService.getItem<DisplayPreference[]>(
        STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES
      );

      if (savedPreferences && Array.isArray(savedPreferences)) {
        logger.log('Loaded display preferences:', savedPreferences.map((p: DisplayPreference) => ({
          id: p.id,
          enabled: p.enabled,
        })));

        const mergedPreferences = defaultPreferences.map(defaultPref => {
          const savedPref = savedPreferences.find(p => p.id === defaultPref.id);
          return savedPref ? { ...defaultPref, ...savedPref } : defaultPref;
        });

        setDisplayPreferences(mergedPreferences);
      } else {
        logger.log('Using default preferences:', defaultPreferences.map(p => ({
          id: p.id,
          enabled: p.enabled,
        })));
        setDisplayPreferences(defaultPreferences);
      }
    } catch (err) {
      logger.error('Error loading display preferences:', err);
      setDisplayPreferences(defaultPreferences);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDisplayPreferences = useCallback(async (preferences: DisplayPreference[]) => {
    try {
      const success = await storageService.setItem(
        STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES,
        preferences
      );
      if (success) {
        setDisplayPreferences(preferences);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Error saving display preferences:', err);
      return false;
    }
  }, []);

  const resetToDefaults = useCallback(async () => {
    try {
      const success = await storageService.setItem(
        STORAGE_KEYS.INVENTORY_DISPLAY_PREFERENCES,
        defaultPreferences
      );
      if (success) {
        setDisplayPreferences(defaultPreferences);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Error resetting preferences:', err);
      return false;
    }
  }, []);

  const getPreference = useCallback((id: string): boolean => {
    const preference = displayPreferences.find(p => p.id === id);
    return preference?.enabled ?? false;
  }, [displayPreferences]);

  return {
    displayPreferences,
    isLoading,
    loadDisplayPreferences,
    saveDisplayPreferences,
    resetToDefaults,
    getPreference,
  };
};
