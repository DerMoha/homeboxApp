import axios, {AxiosInstance} from 'axios';
import {CreateItemRequest} from '../../../types';
import {createItem, getInventory} from '../serverApi/inventoryApi';
import {
  getLocationItems,
  getLocationTree,
  getLocations,
} from '../serverApi/locationsApi';
import {getLabels} from '../serverApi/labelsApi';

const createClient = (): AxiosInstance =>
  ({
    delete: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  } as unknown as AxiosInstance);

describe('Homebox API routes', () => {
  it('encodes location filters using repeated query keys accepted by Homebox', async () => {
    const client = createClient();
    (client.get as jest.Mock).mockResolvedValue({data: {items: []}});
    await getLocationItems(client, 'basement');
    const [url, config] = (client.get as jest.Mock).mock.calls[0];
    const uri = axios.getUri({url, ...config});
    expect(uri).toContain('parentIds=basement');
    expect(uri).not.toContain('parentIds%5B');
  });

  it('returns the created item after an optional update fails so retry cannot duplicate it', async () => {
    const client = createClient();
    (client.post as jest.Mock).mockResolvedValue({
      data: {id: 'saved-item', name: 'Camera', quantity: 1},
    });
    (client.put as jest.Mock).mockRejectedValue(new Error('Connection lost'));
    const result = await createItem(client, {
      name: 'Camera',
      quantity: 1,
      locationId: 'basement',
      purchasePrice: 20,
    });
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('saved-item');
    expect(result.warning).toContain('optional fields');
    expect(client.post).toHaveBeenCalledTimes(1);
  });
  it('queries inventory through entities with item filtering', async () => {
    const client = createClient();
    const get = client.get as jest.Mock;
    get.mockResolvedValue({data: {items: [], page: 2, pageSize: 25, total: 0}});

    await getInventory(client, 'token', 2, 25);

    expect(get).toHaveBeenCalledWith('/api/v1/entities', {
      params: {page: 2, pageSize: 25, isLocation: false},
    });
  });

  it('uses the unified entity and tree routes for locations', async () => {
    const client = createClient();
    const get = client.get as jest.Mock;
    get
      .mockResolvedValueOnce({
        data: {items: [], page: -1, pageSize: -1, total: 0},
      })
      .mockResolvedValueOnce({
        data: {items: [], page: -1, pageSize: -1, total: 0},
      })
      .mockResolvedValueOnce({data: []});

    await getLocations(client, 'token');
    await getLocationItems(client, 'location-1');
    await getLocationTree(client);

    expect(get).toHaveBeenNthCalledWith(1, '/api/v1/entities', {
      params: {isLocation: true, page: -1, pageSize: -1},
    });
    expect(get).toHaveBeenNthCalledWith(2, '/api/v1/entities', {
      params: {
        isLocation: false,
        parentIds: ['location-1'],
        page: -1,
        pageSize: -1,
      },
      paramsSerializer: {indexes: null},
    });
    expect(get).toHaveBeenNthCalledWith(3, '/api/v1/entities/tree', {
      params: {withItems: false},
    });
  });

  it('reads tags from the official tags route', async () => {
    const client = createClient();
    const get = client.get as jest.Mock;
    get.mockResolvedValue({data: [{id: 'tag-1', name: 'Photo'}]});

    const result = await getLabels(client, 'token');

    expect(get).toHaveBeenCalledWith('/api/v1/tags');
    expect(result.data).toEqual([{id: 'tag-1', name: 'Photo'}]);
  });

  it('creates items through the official entity route', async () => {
    const client = createClient();
    const post = client.post as jest.Mock;
    const item: CreateItemRequest = {
      name: 'Camera',
      description: 'Body',
      quantity: 1,
      locationId: 'shelf-1',
      labels: ['tag-1'],
    };
    post.mockResolvedValue({data: {id: 'item-1', name: 'Camera', quantity: 1}});

    const result = await createItem(client, item);

    expect(post).toHaveBeenCalledWith('/api/v1/entities', {
      name: 'Camera',
      description: 'Body',
      quantity: 1,
      parentId: 'shelf-1',
      tagIds: ['tag-1'],
    });
    expect(result.success).toBe(true);
  });
});
