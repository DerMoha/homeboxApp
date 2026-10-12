import AsyncStorage from '@react-native-async-storage/async-storage';
import {FilterState, Item, SortOption} from '../types';
export type ReviewList =
  'all' | 'no-photo' | 'uninsured-value' | 'no-location' | 'recent';
export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: FilterState;
  sort: SortOption;
  review: ReviewList;
}
const key = (server: string) => `@saved-searches:${encodeURIComponent(server)}`;
export const savedSearchService = {
  async load(server: string): Promise<SavedSearch[]> {
    const raw = await AsyncStorage.getItem(key(server));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Saved searches could not be read');
    }
    return parsed;
  },
  async save(server: string, searches: SavedSearch[]) {
    await AsyncStorage.setItem(key(server), JSON.stringify(searches));
  },
};
export const matchesReview = (
  item: Item,
  review: ReviewList,
  now = Date.now(),
) => {
  switch (review) {
    case 'no-photo':
      return !item.imageId;
    case 'uninsured-value':
      return !item.insured && item.purchasePrice >= 500;
    case 'no-location':
      return !item.location;
    case 'recent':
      return (
        new Date(item.createdAt).getTime() >= now - 7 * 24 * 60 * 60 * 1000
      );
    default:
      return true;
  }
};
