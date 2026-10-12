import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'react-native-fs';
import {draftKey, ItemDraft, itemDraftService} from '../itemDraftService';

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const files = FileSystem as jest.Mocked<typeof FileSystem>;
const draft: ItemDraft = {
  formData: {name: 'Drill', quantity: '2', description: 'Cordless'},
  selectedLocation: {id: 'garage', name: 'Garage', description: ''},
  selectedLabels: [{id: 'tools', name: 'Tools'}],
  imageUri: 'file:///cache/drill.jpg',
  updatedAt: '2026-10-12T12:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  const data = new Map<string, string>();
  storage.setItem.mockImplementation(async (key, value) => {
    data.set(key, value);
  });
  storage.getItem.mockImplementation(async key => data.get(key) ?? null);
  storage.removeItem.mockImplementation(async key => {
    data.delete(key);
  });
  files.exists.mockResolvedValue(true);
});

test('restores fields, labels, location, and a durable photo after a fresh load', async () => {
  const key = draftKey('server-a');
  await itemDraftService.save(key, draft);
  const restored = await itemDraftService.load(key);
  expect(restored).toEqual({
    ...draft,
    imageUri: expect.stringContaining('file:///documents/item-drafts/'),
  });
  expect(files.copyFile).toHaveBeenCalledWith(
    '/cache/drill.jpg',
    expect.stringContaining('/documents/item-drafts/'),
  );
});

test('isolates servers, new items, and edits', async () => {
  await itemDraftService.save(draftKey('a'), draft);
  expect(await itemDraftService.load(draftKey('b'))).toBeNull();
  expect(await itemDraftService.load(draftKey('a', 'item-1'))).toBeNull();
});

test('retains fields when a photo has been removed by the operating system', async () => {
  const key = draftKey('a');
  await itemDraftService.save(key, draft);
  files.exists.mockResolvedValueOnce(false);
  expect(await itemDraftService.load(key)).toEqual({...draft, imageUri: null});
});

test('clearing after a pending autosave cannot resurrect the draft', async () => {
  const key = draftKey('a');
  const save = itemDraftService.save(key, draft);
  const clear = itemDraftService.clear(key);
  await Promise.all([save, clear]);
  expect(await itemDraftService.load(key)).toBeNull();
  expect(files.unlink).toHaveBeenCalledWith(
    expect.stringContaining('/documents/item-drafts/'),
  );
});

test('a failed photo copy keeps the previous recoverable draft', async () => {
  const key = draftKey('a');
  await itemDraftService.save(key, {...draft, imageUri: null});
  files.copyFile.mockRejectedValueOnce(new Error('Disk full'));
  await expect(itemDraftService.save(key, draft)).rejects.toThrow('Disk full');
  expect(await itemDraftService.load(key)).toEqual({...draft, imageUri: null});
});

test('restores durable document attachments with their types', async () => {
  const key = draftKey('documents');
  await itemDraftService.save(key, {
    ...draft,
    imageUri: null,
    attachments: [
      {
        id: 'receipt',
        uri: 'file:///cache/receipt.pdf',
        name: 'receipt.pdf',
        type: 'receipt',
        mimeType: 'application/pdf',
      },
      {
        id: 'manual',
        uri: 'file:///cache/manual.pdf',
        name: 'manual.pdf',
        type: 'manual',
        mimeType: 'application/pdf',
      },
    ],
  });
  const saved = await itemDraftService.load(key);
  expect(saved?.attachments).toEqual([
    expect.objectContaining({
      type: 'receipt',
      name: 'receipt.pdf',
      uri: expect.stringContaining('/documents/item-drafts/'),
    }),
    expect.objectContaining({type: 'manual', name: 'manual.pdf'}),
  ]);
});
