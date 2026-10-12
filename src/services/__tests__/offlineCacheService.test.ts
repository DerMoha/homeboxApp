import AsyncStorage from '@react-native-async-storage/async-storage';
import {offlineCacheService} from '../offlineCacheService';
import {Item} from '../../types';

beforeEach(() => {
  jest.clearAllMocks();
  const memory = new Map<string, string>();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(
    async key => memory.get(key) ?? null,
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
    memory.set(key, value);
  });
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(async key => {
    memory.delete(key);
  });
  (AsyncStorage.getAllKeys as jest.Mock).mockImplementation(async () => [
    ...memory.keys(),
  ]);
  (AsyncStorage.removeMany as jest.Mock).mockImplementation(async keys => {
    keys.forEach((key: string) => memory.delete(key));
  });
});

test('persists a successful read and serves it with its freshness after connection loss', async () => {
  const online = await offlineCacheService.read(
    'a',
    'inventory:-1:-1',
    async () => ({success: true, data: {items: [{id: 'one'}], total: 1}}),
  );
  const offline = await offlineCacheService.read(
    'a',
    'inventory:-1:-1',
    async () => ({success: false, error: 'No connection'}),
  );
  expect(offline).toEqual({
    success: true,
    data: online.data,
    cachedAt: online.cachedAt,
    fromCache: true,
  });
});

test('never serves another server cache and clears only the selected server', async () => {
  await offlineCacheService.set('a', 'labels', [{id: 'private-a'}]);
  await offlineCacheService.set('b', 'labels', [{id: 'private-b'}]);
  expect(
    await offlineCacheService.read('c', 'labels', async () => ({
      success: false,
    })),
  ).toEqual({success: false});
  await offlineCacheService.clear('a');
  expect(await offlineCacheService.get('a', 'labels')).toBeNull();
  expect(await offlineCacheService.get('b', 'labels')).not.toBeNull();
});

test('updates and deletes cached inventory after mutations instead of resurrecting stale items', async () => {
  const item = {id: 'one', name: 'Old', location: {id: 'garage'}} as Item;
  await offlineCacheService.set('a', 'inventory:-1:-1', {
    items: [item],
    total: 1,
  });
  await offlineCacheService.recordItem('a', {...item, name: 'Updated'});
  expect(
    (await offlineCacheService.get<{items: Item[]}>('a', 'inventory:-1:-1'))
      ?.data.items[0].name,
  ).toBe('Updated');
  await offlineCacheService.recordItem('a', null, 'one');
  expect(
    (await offlineCacheService.get<{items: Item[]}>('a', 'inventory:-1:-1'))
      ?.data.items,
  ).toEqual([]);
  expect(await offlineCacheService.get('a', 'item:one')).toBeNull();
});

test('online browsing still works when the cache disk is full', async () => {
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Full'));
  expect(
    await offlineCacheService.read('full', 'tree', async () => ({
      success: true,
      data: [],
    })),
  ).toMatchObject({success: true, data: [], fromCache: false});
});
