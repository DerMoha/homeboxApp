import AsyncStorage from '@react-native-async-storage/async-storage';
import {saveRecoveryService, SaveGateway} from '../saveRecoveryService';
import {Item} from '../../types';

const data = {
  name: 'Drill',
  quantity: 1,
  locationId: 'garage',
  purchasePrice: 50,
};
const item = {
  id: 'saved',
  ...data,
  location: {id: 'garage'},
} as unknown as Item;
let gateway: jest.Mocked<SaveGateway>;
beforeEach(() => {
  jest.clearAllMocks();
  const memory = new Map<string, string>();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(
    async key => memory.get(key) ?? null,
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
    memory.set(key, value);
  });
  gateway = {
    getCurrentConfig: jest.fn(() => ({id: 'server-a'})),
    createItem: jest.fn().mockResolvedValue({success: true, data: item}),
    updateItem: jest.fn().mockResolvedValue({success: true, data: item}),
    getItemById: jest.fn().mockResolvedValue({success: true, data: item}),
    getInventory: jest
      .fn()
      .mockResolvedValue({success: true, data: {items: [item]}}),
    uploadItemImage: jest.fn().mockResolvedValue({success: true, data: item}),
  };
});

test('retries a failed photo on the saved ID without creating again', async () => {
  gateway.uploadItemImage.mockResolvedValueOnce({success: false});
  const result = await saveRecoveryService.begin(
    gateway,
    data,
    'file:///cache/photo.jpg',
  );
  expect(result.success).toBe(true);
  const [job] = await saveRecoveryService.list('server-a');
  expect(job.itemId).toBe('saved');
  await saveRecoveryService.resume(gateway, job);
  expect(gateway.createItem).toHaveBeenCalledTimes(1);
  expect(gateway.uploadItemImage).toHaveBeenLastCalledWith(
    'saved',
    expect.any(FormData),
  );
  expect(await saveRecoveryService.list('server-a')).toEqual([]);
});

test('retries optional fields without recreating the item', async () => {
  gateway.createItem.mockResolvedValueOnce({
    success: true,
    data: item,
    warning: 'Optional fields failed',
  });
  await saveRecoveryService.begin(gateway, data, null);
  const [job] = await saveRecoveryService.list('server-a');
  expect(job.fieldsPending).toBe(true);
  await saveRecoveryService.resume(gateway, job);
  expect(gateway.updateItem).toHaveBeenCalledWith({...data, id: 'saved'});
  expect(gateway.createItem).toHaveBeenCalledTimes(1);
});

test('blocks another create after a timeout and reconciles an existing server item', async () => {
  gateway.createItem.mockResolvedValueOnce({success: false, uncertain: true});
  await saveRecoveryService.begin(gateway, data, null);
  const [job] = await saveRecoveryService.list('server-a');
  expect(job.uncertain).toBe(true);
  await expect(saveRecoveryService.resume(gateway, job)).rejects.toThrow(
    'Check the server',
  );
  await expect(saveRecoveryService.begin(gateway, data, null)).rejects.toThrow(
    'uncertain outcome',
  );
  expect(await saveRecoveryService.candidates(gateway, job)).toEqual([item]);
  await saveRecoveryService.reconcile(gateway, job, 'saved');
  expect(gateway.createItem).toHaveBeenCalledTimes(1);
  expect(await saveRecoveryService.list('server-a')).toEqual([]);
});

test('requires explicit confirmation to create after uncertain failure', async () => {
  gateway.createItem.mockResolvedValueOnce({success: false, uncertain: true});
  await saveRecoveryService.begin(gateway, data, null);
  const [job] = await saveRecoveryService.list('server-a');
  await expect(saveRecoveryService.reconcile(gateway, job)).rejects.toThrow(
    'Check the server',
  );
  await saveRecoveryService.reconcile(gateway, job, undefined, true);
  expect(gateway.createItem).toHaveBeenCalledTimes(2);
});

test('does not duplicate a photo uploaded before a timeout', async () => {
  gateway.uploadItemImage.mockResolvedValueOnce({success: false});
  await saveRecoveryService.begin(gateway, data, 'file:///cache/photo.jpg');
  const [job] = await saveRecoveryService.list('server-a');
  gateway.getItemById.mockResolvedValueOnce({
    success: true,
    data: {
      ...item,
      attachments: [{id: 'photo', title: `homebox-mobile-${job.id}.jpg`}],
    },
  });
  await saveRecoveryService.resume(gateway, job);
  expect(gateway.uploadItemImage).toHaveBeenCalledTimes(1);
  expect(await saveRecoveryService.list('server-a')).toEqual([]);
});

test('isolates pending records and refuses recovery on a different server', async () => {
  gateway.createItem.mockResolvedValueOnce({success: false, uncertain: true});
  await saveRecoveryService.begin(gateway, data, null);
  const [job] = await saveRecoveryService.list('server-a');
  expect(await saveRecoveryService.list('server-b')).toEqual([]);
  gateway.getCurrentConfig.mockReturnValue({id: 'server-b'});
  await expect(saveRecoveryService.resume(gateway, job)).rejects.toThrow(
    'original server',
  );
});

test('does not keep a recovery record for a definitive rejection', async () => {
  gateway.createItem.mockResolvedValueOnce({
    success: false,
    uncertain: false,
    error: 'Invalid data',
  });
  await saveRecoveryService.begin(gateway, data, null);
  expect(await saveRecoveryService.list('server-a')).toEqual([]);
});

test('keeps only unfinished attachments and retries them on the original item', async () => {
  gateway.uploadItemImage
    .mockResolvedValueOnce({success: true, data: item})
    .mockResolvedValueOnce({success: false});
  await saveRecoveryService.begin(gateway, data, null, undefined, [
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
  ]);
  const [job] = await saveRecoveryService.list('server-a');
  expect(job.attachments?.map(file => file.id)).toEqual(['manual']);
  await saveRecoveryService.resume(gateway, job);
  expect(gateway.createItem).toHaveBeenCalledTimes(1);
  expect(gateway.uploadItemImage).toHaveBeenCalledTimes(3);
  expect(await saveRecoveryService.list('server-a')).toEqual([]);
});

test('blocks a fresh create after restarting with a known item and unfinished attachments', async () => {
  gateway.uploadItemImage.mockResolvedValueOnce({success: false});
  await saveRecoveryService.begin(gateway, data, 'file:///cache/photo.jpg');
  await expect(
    saveRecoveryService.begin(gateway, data, 'file:///cache/photo.jpg'),
  ).rejects.toThrow('unfinished save');
  expect(gateway.createItem).toHaveBeenCalledTimes(1);
});
