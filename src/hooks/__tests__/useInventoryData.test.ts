import {act, renderHook} from '@testing-library/react-native';
import {useInventoryData} from '../useInventoryData';
import ServerService from '../../services/serverService';
import {offlineCacheService} from '../../services/offlineCacheService';
jest.mock('../../services/offlineCacheService');

jest.mock('../../services/serverService');
const items = Array.from({length: 75}, (_, index) => ({
  id: String(index),
  name: `Item ${index}`,
  quantity: 1,
  location: null,
}));
const getInventory = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  getInventory.mockReset().mockImplementation((page: number) =>
    Promise.resolve({
      success: true,
      cachedAt: '2026-10-12T12:00:00Z',
      data: {items: items.slice((page - 1) * 50, page * 50), total: 75},
    }),
  );
  (ServerService.getInstance as jest.Mock).mockReturnValue({
    getInventory,
    getBrowsingConfig: () => ({id: 'test-server'}),
  });
});
it('requests bounded pages and appends without losing the first page', async () => {
  const {result} = await renderHook(() => useInventoryData('camera'));
  await act(async () => {
    await result.current.loadInventory();
  });
  expect(getInventory).toHaveBeenCalledWith(1, 50, 'camera');
  expect(result.current.inventory).toHaveLength(50);
  expect(result.current.hasMore).toBe(true);
  await act(async () => {
    await result.current.loadMore();
  });
  expect(getInventory).toHaveBeenLastCalledWith(2, 50, 'camera');
  expect(result.current.inventory).toHaveLength(75);
  expect(result.current.hasMore).toBe(false);
});
it('retains loaded records on a failed page and retries the same page', async () => {
  const {result} = await renderHook(() => useInventoryData());
  await act(async () => {
    await result.current.loadInventory();
  });
  getInventory.mockResolvedValueOnce({success: false, error: 'Unavailable'});
  await act(async () => {
    await result.current.loadMore();
  });
  expect(result.current.inventory).toHaveLength(50);
  expect(result.current.error).toBe('Unavailable');
  expect(result.current.cacheInfo.cachedAt).toBe('2026-10-12T12:00:00Z');
  await act(async () => {
    await result.current.loadMore();
  });
  expect(getInventory).toHaveBeenLastCalledWith(2, 50, '');
  expect(result.current.inventory).toHaveLength(75);
});
it('loads all remaining pages on request', async () => {
  const {result} = await renderHook(() => useInventoryData());
  await act(async () => {
    await result.current.loadInventory();
  });
  await act(async () => {
    await result.current.loadAll();
  });
  expect(result.current.inventory).toHaveLength(75);
  expect(result.current.hasMore).toBe(false);
});

it('does not mark cached pages as a freshly downloaded offline snapshot', async () => {
  getInventory.mockImplementation((page: number) =>
    Promise.resolve({
      success: true,
      fromCache: true,
      cachedAt: '2026-10-01T12:00:00Z',
      data: {items: items.slice((page - 1) * 50, page * 50), total: 75},
    }),
  );
  const {result} = await renderHook(() => useInventoryData());
  await act(async () => {
    await result.current.loadInventory();
  });
  await act(async () => {
    await result.current.loadAll();
  });
  expect(result.current.cacheInfo.fromCache).toBe(true);
  expect(result.current.cacheInfo.cachedAt).toBe('2026-10-01T12:00:00Z');
  expect(offlineCacheService.set).not.toHaveBeenCalled();
});
