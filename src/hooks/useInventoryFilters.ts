import {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import ServerService from '../services/serverService';
import {FilterState} from '../types';
import {storageService, STORAGE_KEYS} from '../services/storageService';
import {getActiveFilterCount} from '../utils/inventoryFilters';
import {logger} from '../utils/logger';

const DEFAULT_FILTERS: FilterState = {
  locationId: null,
  labelIds: [],
  insuranceStatus: 'all',
  quantityMin: null,
  quantityMax: null,
  dateRange: 'all',
};

export const useInventoryFilters = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Filter state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const serverRef = useRef<string | undefined>(undefined);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  // Load filters independently for each server.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const server = ServerService.getInstance().getBrowsingConfig()?.id;
      if (server === serverRef.current) {
        return;
      }
      setStorageKey(null);
      setFilters(DEFAULT_FILTERS);
      setTempFilters(DEFAULT_FILTERS);
      setSearchQuery('');
      setDebouncedQuery('');
      if (server) {
        const key = `${STORAGE_KEYS.INVENTORY_FILTERS}:${encodeURIComponent(server)}`;
        storageService.getItem<FilterState>(key).then(saved => {
          if (active) {
            serverRef.current = server;
            setFilters(saved || DEFAULT_FILTERS);
            setTempFilters(saved || DEFAULT_FILTERS);
            setStorageKey(key);
          }
        });
      }
      return () => {
        active = false;
      };
    }, []),
  );

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Save filters to storage when they change
  useEffect(() => {
    const saveFilters = async () => {
      try {
        if (storageKey) {
          await storageService.setItem(storageKey, filters);
        }
      } catch (error) {
        logger.error('Error saving filters:', error);
      }
    };

    saveFilters();
  }, [filters, storageKey]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  // Update temporary filters (used in modal before applying)
  const updateTempFilters = useCallback((updates: Partial<FilterState>) => {
    setTempFilters(prev => ({...prev, ...updates}));
  }, []);

  // Apply filters from temp state
  const applyFilters = useCallback(() => {
    setFilters(tempFilters);
  }, [tempFilters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setTempFilters(DEFAULT_FILTERS);
  }, []);

  // Reset temp filters to current filters (cancel modal changes)
  const resetTempFilters = useCallback(() => {
    setTempFilters(filters);
  }, [filters]);

  // Calculate active filter count
  const activeFilterCount = useMemo(
    () => getActiveFilterCount(filters),
    [filters],
  );

  return {
    // Search
    searchQuery,
    debouncedQuery,
    setSearchQuery,
    clearSearch,

    // Filters
    setFilters,
    setTempFilters,
    filters,
    tempFilters,
    updateTempFilters,
    applyFilters,
    clearAllFilters,
    resetTempFilters,
    activeFilterCount,
  };
};
