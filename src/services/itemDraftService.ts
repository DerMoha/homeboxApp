import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'react-native-fs';
import {LocalAttachment} from './attachmentService';
import {ItemFormData} from '../hooks/useItemFormState';
import {Label, Location} from '../types';

export interface ItemDraft {
  formData: ItemFormData;
  selectedLocation: Location | null;
  selectedLabels: Label[];
  imageUri: string | null;
  attachments?: LocalAttachment[];
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
    if (draft.attachments) {
      draft.attachments = await Promise.all(
        draft.attachments.map(async attachment => ({
          ...attachment,
          missing: !(await FileSystem.exists(
            attachment.uri.replace('file://', ''),
          )),
        })),
      );
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
        Boolean(draft.imageUri) ||
        Boolean(draft.attachments?.length);
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
      const attachments = draft.attachments
        ? ([] as LocalAttachment[])
        : undefined;
      if (draft.attachments?.length) {
        const directory = `${FileSystem.DocumentDirectoryPath}/item-drafts/${encodeURIComponent(key)}-attachments`;
        await FileSystem.mkdir(directory);
        for (const attachment of draft.attachments) {
          const path = `${directory}/${attachment.id}-${attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          if (
            !attachment.missing &&
            attachment.uri.replace('file://', '') !== path
          ) {
            await FileSystem.copyFile(
              attachment.uri.replace('file://', ''),
              path,
            );
          }
          attachments?.push({...attachment, uri: `file://${path}`});
        }
      }
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          ...draft,
          imageUri,
          ...(attachments ? {attachments} : {}),
        }),
      );
      if (!imageUri && (await FileSystem.exists(photoPath))) {
        await FileSystem.unlink(photoPath);
      }
    });
  },
  clear(key: string): Promise<void> {
    return serialize(async () => {
      await AsyncStorage.removeItem(key);
      const folder = `${FileSystem.DocumentDirectoryPath}/item-drafts/${encodeURIComponent(key)}-attachments`;
      if (await FileSystem.exists(folder)) {
        await FileSystem.unlink(folder);
      }
      const path = `${FileSystem.DocumentDirectoryPath}/item-drafts/${encodeURIComponent(key)}.jpg`;
      if (await FileSystem.exists(path)) {
        await FileSystem.unlink(path);
      }
    });
  },
};
