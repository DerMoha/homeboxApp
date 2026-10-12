import {useState, useCallback, useRef} from 'react';
import ServerService from '../services/serverService';
import {offlineCacheService} from '../services/offlineCacheService';
import {logger} from '../utils/logger';
import {ApiResponse, InventoryItem, SortOption} from '../types';

export const useInventoryData = (query = '') => {
  const pageRef = useRef(0);
  const sourceRef = useRef<{fromCache: boolean; cachedAt?: string}>({
    fromCache: false,
  });
  const loadingRef = useRef(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
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

  const fetchPage = useCallback(
    async (append: boolean) => {
      const service = ServerService.getInstance();
      const serverId = service.getBrowsingConfig()?.id;
      if (append && loadingRef.current) {
        return;
      }
      const request = ++requestNumber.current;
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      if (!append || activeServer.current !== serverId) {
        activeServer.current = serverId;
        pageRef.current = 0;
        sourceRef.current = {fromCache: false};
        setInventory([]);
        setCacheInfo({success: false});
      }
      const page = pageRef.current + 1;
      try {
        const response = await service.getInventory(page, 50, query.trim());
        if (
          request !== requestNumber.current ||
          service.getBrowsingConfig()?.id !== serverId
        ) {
          return;
        }
        sourceRef.current = {
          fromCache: sourceRef.current.fromCache || Boolean(response.fromCache),
          cachedAt:
            sourceRef.current.cachedAt &&
            response.cachedAt &&
            sourceRef.current.cachedAt < response.cachedAt
              ? sourceRef.current.cachedAt
              : response.cachedAt,
        };
        setCacheInfo({...response, ...sourceRef.current});
        if (!response.success || !response.data) {
          setError(response.error || 'Failed to load inventory');
          return;
        }
        const data = response.data;
        pageRef.current = page;
        setTotal(data.total);
        setHasMore(data.items.length > 0 && page * 50 < data.total);
        setInventory(previous => {
          const records = new Map(
            (append ? previous : []).map(item => [item.id, item]),
          );
          data.items.forEach(item => records.set(item.id, item));
          return sortInventory([...records.values()], sortOption);
        });
      } catch (err) {
        logger.error('Error loading inventory:', {error: err});
        if (request === requestNumber.current) {
          setError('Error loading inventory');
        }
      } finally {
        if (request === requestNumber.current) {
          loadingRef.current = false;
          setIsLoading(false);
          setRefreshing(false);
        }
      }
    },
    [query, sortOption, sortInventory],
  );
  const loadInventory = useCallback(() => fetchPage(false), [fetchPage]);
  const loadMore = useCallback(
    () => (hasMore ? fetchPage(true) : Promise.resolve()),
    [fetchPage, hasMore],
  );

  const loadAll = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }
    const service = ServerService.getInstance();
    const serverId = service.getBrowsingConfig()?.id;
    const request = ++requestNumber.current;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    const records = new Map(inventory.map(item => [item.id, item]));
    let page = pageRef.current;
    let responseTotal = total;
    try {
      do {
        const response = await service.getInventory(++page, 50, query.trim());
        if (
          request !== requestNumber.current ||
          service.getBrowsingConfig()?.id !== serverId
        ) {
          return;
        }
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to load remaining items');
        }
        responseTotal = response.data.total;
        response.data.items.forEach(item => records.set(item.id, item));
        pageRef.current = page;
        setInventory(sortInventory([...records.values()], sortOption));
        setTotal(responseTotal);
        sourceRef.current = {
          fromCache: sourceRef.current.fromCache || Boolean(response.fromCache),
          cachedAt:
            sourceRef.current.cachedAt &&
            response.cachedAt &&
            sourceRef.current.cachedAt < response.cachedAt
              ? sourceRef.current.cachedAt
              : response.cachedAt,
        };
        setCacheInfo({...response, ...sourceRef.current});
        setHasMore(page * 50 < responseTotal && response.data.items.length > 0);
        if (!response.data.items.length) {
          break;
        }
      } while (page * 50 < responseTotal);
      if (
        serverId &&
        !query.trim() &&
        !sourceRef.current.fromCache &&
        records.size >= responseTotal
      ) {
        await offlineCacheService.set(serverId, 'inventory:-1:-1', {
          items: [...records.values()],
          total: responseTotal,
          page: -1,
          pageSize: -1,
        });
      }
    } catch (err) {
      if (request === requestNumber.current) {
        setError(
          err instanceof Error ? err.message : 'Failed to load inventory',
        );
      }
    } finally {
      if (request === requestNumber.current) {
        loadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [inventory, query, sortInventory, sortOption, total]);
  const cancelLoading = useCallback(() => {
    requestNumber.current++;
    loadingRef.current = false;
    setIsLoading(false);
    setRefreshing(false);
  }, []);

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
    total,
    loadAll,
    cancelLoading,
    hasMore,
    loadMore,
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
