import {useState, useEffect, useCallback, useMemo} from 'react';
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

  // Load filters from storage on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedFilters = await storageService.getItem<FilterState>(
          STORAGE_KEYS.INVENTORY_FILTERS,
        );
        if (savedFilters) {
          setFilters(savedFilters);
          setTempFilters(savedFilters);
        }
      } catch (error) {
        logger.error('Error loading filters:', error);
      }
    };

    loadFilters();
  }, []);

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
        await storageService.setItem(STORAGE_KEYS.INVENTORY_FILTERS, filters);
      } catch (error) {
        logger.error('Error saving filters:', error);
      }
    };

    saveFilters();
  }, [filters]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  // Update temporary filters (used in modal before applying)
  const updateTempFilters = useCallback(
    (updates: Partial<FilterState>) => {
      setTempFilters(prev => ({...prev, ...updates}));
    },
    [],
  );

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
    filters,
    tempFilters,
    updateTempFilters,
    applyFilters,
    clearAllFilters,
    resetTempFilters,
    activeFilterCount,
  };
};
