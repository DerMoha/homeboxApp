import {useState, useCallback, useRef} from 'react';
import ServerService from '../services/serverService';
import {logger} from '../utils/logger';
import {ApiResponse, InventoryItem, SortOption} from '../types';

export const useInventoryData = () => {
  const activeServer = useRef<string | undefined>(undefined);
  const requestNumber = useRef(0);
  const [cacheInfo, setCacheInfo] = useState<ApiResponse>({success: false});
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortInventory = useCallback(
    (items: InventoryItem[], sortBy: SortOption): InventoryItem[] => {
      if (!items || !Array.isArray(items)) {
        return [];
      }

      const locationCounts = new Map<string, number>();
      items.forEach(item => {
        if (item.location?.id) {
          locationCounts.set(
            item.location.id,
            (locationCounts.get(item.location.id) || 0) + 1,
          );
        }
      });

      const itemsWithCounts = items.map(item => {
        if (item.location?.id) {
          const count = locationCounts.get(item.location.id) || 0;
          return {
            ...item,
            location: {...item.location, itemCount: count},
          };
        }
        return item;
      });

      return [...itemsWithCounts].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'quantity':
            return b.quantity - a.quantity;
          case 'createdAt':
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          case 'updatedAt':
            return (
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          case 'location':
            return (a.location?.name || '').localeCompare(
              b.location?.name || '',
            );
          default:
            return 0;
        }
      });
    },
    [],
  );

  const loadInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const service = ServerService.getInstance();
      const serverId = service.getBrowsingConfig()?.id;
      if (activeServer.current !== serverId) {
        activeServer.current = serverId;
        setInventory([]);
        setCacheInfo({success: false});
      }
      const request = ++requestNumber.current;
      const response = await service.getInventory(-1, -1);

      if (request !== requestNumber.current) {
        return;
      }
      setCacheInfo(response);

      if (response.success && response.data) {
        const items = (response.data as {items?: InventoryItem[]}).items || [];
        const sortedItems = sortInventory(items, sortOption);
        setInventory(sortedItems);
      } else {
        setError('Failed to load inventory');
      }
    } catch (err) {
      logger.error('Error loading inventory:', {error: err});
      setError('Error loading inventory');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [sortOption, sortInventory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInventory();
  }, [loadInventory]);

  const updateSortOption = useCallback(
    (option: SortOption) => {
      setSortOption(option);
      const sortedItems = sortInventory(inventory, option);
      setInventory(sortedItems);
    },
    [inventory, sortInventory],
  );

  return {
    cacheInfo,
    inventory,
    sortOption,
    isLoading,
    refreshing,
    error,
    loadInventory,
    onRefresh,
    updateSortOption,
  };
};
