import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'react-native-fs';
import {ItemFormData} from '../hooks/useItemFormState';
import {Label, Location} from '../types';

export interface ItemDraft {
  formData: ItemFormData;
  selectedLocation: Location | null;
  selectedLabels: Label[];
  imageUri: string | null;
  updatedAt: string;
}

export const draftKey = (serverId: string, itemId?: string) =>
  `@item-draft:${encodeURIComponent(serverId)}:${encodeURIComponent(itemId || 'new')}`;

let writes: Promise<unknown> = Promise.resolve();
const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = writes.then(operation, operation);
  writes = result.catch(() => undefined);
  return result;
};

export const itemDraftService = {
  async load(key: string): Promise<ItemDraft | null> {
    await writes;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const draft = JSON.parse(raw) as ItemDraft;
    if (!draft.formData || !Array.isArray(draft.selectedLabels)) {
      return null;
    }
    if (
      draft.imageUri &&
      !(await FileSystem.exists(draft.imageUri.replace('file://', '')))
    ) {
      draft.imageUri = null;
    }
    return draft;
  },
  save(key: string, draft: ItemDraft): Promise<void> {
    return serialize(async () => {
      const meaningful =
        Object.entries(draft.formData).some(
          ([field, value]) =>
            field !== 'quantity' &&
            value !== undefined &&
            value !== '' &&
            value !== false,
        ) ||
        draft.selectedLabels.length > 0 ||
        Boolean(draft.imageUri);
      const photoPath = `${FileSystem.DocumentDirectoryPath}/item-drafts/${encodeURIComponent(key)}.jpg`;
      if (!meaningful) {
        await AsyncStorage.removeItem(key);
        if (await FileSystem.exists(photoPath)) {
          await FileSystem.unlink(photoPath);
        }
        return;
      }
      let imageUri = draft.imageUri;
      if (imageUri) {
        const directory = `${FileSystem.DocumentDirectoryPath}/item-drafts`;
        await FileSystem.mkdir(directory);
        const path = `${directory}/${encodeURIComponent(key)}.jpg`;
        if (imageUri.replace('file://', '') !== path) {
          await FileSystem.copyFile(imageUri.replace('file://', ''), path);
        }
        imageUri = `file://${path}`;
      }
      await AsyncStorage.setItem(key, JSON.stringify({...draft, imageUri}));
      if (!imageUri && (await FileSystem.exists(photoPath))) {
        await FileSystem.unlink(photoPath);
      }
    });
  },
  clear(key: string): Promise<void> {
    return serialize(async () => {
      await AsyncStorage.removeItem(key);
      const path = `${FileSystem.DocumentDirectoryPath}/item-drafts/${encodeURIComponent(key)}.jpg`;
      if (await FileSystem.exists(path)) {
        await FileSystem.unlink(path);
      }
    });
  },
};
