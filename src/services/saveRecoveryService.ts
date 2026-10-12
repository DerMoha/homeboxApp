import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'react-native-fs';
import {
  ApiResponse,
  CreateItemRequest,
  FormDataFile,
  InventoryResponse,
  Item,
  UpdateItemRequest,
} from '../types';
import {CreateItemResponse} from './server/types';

export interface SaveGateway {
  getCurrentConfig(): {id: string} | null;
  createItem(data: CreateItemRequest): Promise<CreateItemResponse>;
  updateItem(data: UpdateItemRequest): Promise<CreateItemResponse>;
  getItemById(id: string): Promise<ApiResponse<Item>>;
  getInventory(
    page: number,
    pageSize: number,
  ): Promise<ApiResponse<InventoryResponse>>;
  uploadItemImage(id: string, data: FormData): Promise<ApiResponse<Item>>;
}
export interface PendingSave {
  id: string;
  serverId: string;
  createdAt: string;
  data: CreateItemRequest;
  itemId?: string;
  imageUri: string | null;
  fieldsPending: boolean;
  uncertain: boolean;
  error?: string;
}
const storageKey = '@pending-item-saves:v1';
let writes: Promise<unknown> = Promise.resolve();
const running = new Set<string>();
async function read(): Promise<PendingSave[]> {
  await writes;
  return JSON.parse((await AsyncStorage.getItem(storageKey)) || '[]');
}
function change(operation: (jobs: PendingSave[]) => PendingSave[]) {
  const result = writes.then(async () => {
    const jobs: PendingSave[] = JSON.parse(
      (await AsyncStorage.getItem(storageKey)) || '[]',
    );
    await AsyncStorage.setItem(storageKey, JSON.stringify(operation(jobs)));
  });
  writes = result.catch(() => undefined);
  return result;
}
const put = (job: PendingSave) =>
  change(jobs => [...jobs.filter(j => j.id !== job.id), job]);
const assertServer = (gateway: SaveGateway, job: PendingSave) => {
  if (gateway.getCurrentConfig()?.id !== job.serverId) {
    throw new Error('Connect to the original server to recover this save.');
  }
};

export const saveRecoveryService = {
  async list(serverId: string) {
    return (await read()).filter(job => job.serverId === serverId);
  },
  async begin(
    gateway: SaveGateway,
    data: CreateItemRequest,
    imageUri: string | null,
    itemId?: string,
  ) {
    const serverId = gateway.getCurrentConfig()?.id;
    if (!serverId) {
      throw new Error('Connect to a server before saving.');
    }
    const existing = (await this.list(serverId)).find(
      job => job.uncertain && JSON.stringify(job.data) === JSON.stringify(data),
    );
    if (existing && !itemId) {
      throw new Error(
        'This save has an uncertain outcome. Open Pending saves in Settings to check the server before retrying.',
      );
    }
    const job: PendingSave = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      serverId,
      data,
      itemId,
      imageUri: null,
      fieldsPending: true,
      uncertain: false,
      createdAt: new Date().toISOString(),
    };
    if (imageUri) {
      const directory = `${FS.DocumentDirectoryPath}/pending-saves`;
      await FS.mkdir(directory);
      const path = `${directory}/${job.id}.jpg`;
      await FS.copyFile(imageUri.replace('file://', ''), path);
      job.imageUri = `file://${path}`;
    }
    await put(job);
    return this.resume(gateway, job);
  },
  async remove(job: PendingSave) {
    await change(jobs => jobs.filter(j => j.id !== job.id));
    const photo = `${FS.DocumentDirectoryPath}/pending-saves/${job.id}.jpg`;
    if (await FS.exists(photo)) {
      await FS.unlink(photo);
    }
  },
  async candidates(gateway: SaveGateway, job: PendingSave) {
    assertServer(gateway, job);
    const result = await gateway.getInventory(-1, -1);
    if (!result.success || !result.data || result.fromCache) {
      throw new Error(result.error || 'Could not check the server.');
    }
    return result.data.items.filter(
      item =>
        item.name.trim() === job.data.name.trim() &&
        item.location?.id === job.data.locationId &&
        item.quantity === job.data.quantity,
    );
  },
  async reconcile(
    gateway: SaveGateway,
    job: PendingSave,
    itemId?: string,
    confirmedAbsent = false,
  ) {
    assertServer(gateway, job);
    if (!job.uncertain) {
      throw new Error('This save already has a known outcome.');
    }
    if (!itemId && !confirmedAbsent) {
      throw new Error('Check the server before trying another create.');
    }
    if (itemId) {
      const item = await gateway.getItemById(itemId);
      if (!item.success || !item.data) {
        throw new Error('The selected item could not be loaded.');
      }
    }
    const next = {...job, itemId, uncertain: false};
    await put(next);
    return this.resume(gateway, next);
  },
  async resume(
    gateway: SaveGateway,
    original: PendingSave,
  ): Promise<CreateItemResponse> {
    assertServer(gateway, original);
    if (running.has(original.id)) {
      throw new Error('This save is already being recovered.');
    }
    if (original.uncertain) {
      throw new Error('Check the server for this item before retrying.');
    }
    running.add(original.id);
    let job = {...original};
    let saved: Item | undefined;
    try {
      if (!job.itemId) {
        // Persist uncertainty before the network call: a process exit cannot authorize a duplicate create.
        job = {...job, uncertain: true};
        await put(job);
        assertServer(gateway, job);
        const result = await gateway.createItem(job.data);
        if (!result.success || !result.data) {
          job.error = result.error || 'The item could not be saved.';
          job.uncertain = result.uncertain !== false;
          await put(job);
          if (!job.uncertain) {
            await this.remove(job);
          }
          return {
            ...result,
            error: job.uncertain
              ? 'Save outcome unknown. Check Pending saves in Settings before retrying.'
              : job.error,
          };
        }
        saved = result.data;
        job = {
          ...job,
          itemId: saved.id,
          uncertain: false,
          fieldsPending: Boolean(result.warning),
          error: result.warning,
        };
        await put(job);
      } else if (job.fieldsPending) {
        assertServer(gateway, job);
        const result = await gateway.updateItem({...job.data, id: job.itemId});
        if (!result.success || !result.data) {
          job.error = result.error || 'Fields could not be updated.';
          await put(job);
          return {
            success: false,
            error: `${job.error} Retry this item from Pending saves in Settings.`,
          };
        }
        saved = result.data;
        job = {...job, fieldsPending: false, error: undefined};
        await put(job);
      }
      if (job.imageUri && job.itemId) {
        const savedItemId = job.itemId;
        assertServer(gateway, job);
        const marker = `homebox-mobile-${job.id}.jpg`;
        // A timed-out upload may already exist. Check its stable name before retrying.
        if (original.itemId) {
          const current = await gateway.getItemById(job.itemId);
          if (!current.success || !current.data || current.fromCache) {
            throw new Error(
              'Could not check the previous photo upload. Try recovery again when connected.',
            );
          }
          saved = current.data;
          if (current.data.attachments?.some(a => a.title === marker)) {
            job = {...job, imageUri: null};
          }
        }
        if (job.imageUri) {
          const form = new FormData();
          const file: FormDataFile = {
            uri: job.imageUri,
            type: 'image/jpeg',
            name: marker,
          };
          form.append('file', file as unknown as Blob);
          form.append('name', marker);
          form.append('type', 'photo');
          form.append('primary', 'true');
          const result = await gateway.uploadItemImage(savedItemId, form);
          if (!result.success) {
            job.error =
              'Item saved but image upload failed. Retry from Pending saves in Settings.';
            await put(job);
            return {success: true, data: saved, warning: job.error};
          }
          saved = result.data || saved;
          const previousImage = job.imageUri;
          job = {...job, imageUri: null};
          await put(job);
          if (await FS.exists(previousImage.replace('file://', ''))) {
            await FS.unlink(previousImage.replace('file://', ''));
          }
        }
      }
      if (job.fieldsPending) {
        await put(job);
        return {
          success: true,
          data: saved,
          warning: `${job.error || 'Optional fields could not be saved.'} Retry from Pending saves in Settings.`,
        };
      }
      await this.remove(job);
      return {success: true, data: saved};
    } catch (error) {
      job.error =
        error instanceof Error ? error.message : 'Recovery could not complete.';
      await put(job);
      return {
        success: Boolean(saved),
        data: saved,
        error: job.error,
        warning: saved
          ? `${job.error} Retry from Pending saves in Settings.`
          : undefined,
      };
    } finally {
      running.delete(original.id);
    }
  },
};
