import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  savedSearchService,
  matchesReview,
  SavedSearch,
} from '../savedSearchService';
import {Item} from '../../types';
const search: SavedSearch = {
  id: '1',
  name: 'Household',
  query: 'camera',
  filters: {
    locationId: 'room',
    labelIds: ['electronics'],
    insuranceStatus: 'uninsured',
    quantityMin: 1,
    quantityMax: 3,
    dateRange: 'month',
  },
  sort: 'quantity',
  review: 'no-photo',
};
beforeEach(() => {
  const values = new Map<string, string>();
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
    values.set(key, value);
  });
  (AsyncStorage.getItem as jest.Mock).mockImplementation(
    async key => values.get(key) ?? null,
  );
});
it('persists the complete search and keeps servers isolated', async () => {
  await savedSearchService.save('a', [search]);
  expect(await savedSearchService.load('a')).toEqual([search]);
  expect(await savedSearchService.load('b')).toEqual([]);
  await savedSearchService.save('a', []);
  expect(await savedSearchService.load('a')).toEqual([]);
});
it('selects review lists without changing items', () => {
  const item = {
    id: '1',
    imageId: null,
    insured: false,
    purchasePrice: 600,
    location: null,
    createdAt: '2026-10-11T12:00:00Z',
  } as Item;
  const now = Date.parse('2026-10-12T12:00:00Z');
  expect(matchesReview(item, 'no-photo', now)).toBe(true);
  expect(matchesReview(item, 'no-location', now)).toBe(true);
  expect(matchesReview(item, 'uninsured-value', now)).toBe(true);
  expect(matchesReview(item, 'recent', now)).toBe(true);
  expect(matchesReview({...item, insured: true}, 'uninsured-value', now)).toBe(
    false,
  );
  expect(matchesReview({...item, createdAt: '2020-01-01'}, 'recent', now)).toBe(
    false,
  );
  expect(item.purchasePrice).toBe(600);
});
it('reports unreadable storage rather than overwriting it', async () => {
  await AsyncStorage.setItem('@saved-searches:a', 'invalid json');
  await expect(savedSearchService.load('a')).rejects.toThrow();
});
