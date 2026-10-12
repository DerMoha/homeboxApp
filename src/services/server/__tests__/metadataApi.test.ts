import {AxiosInstance} from 'axios';
import {createLabel, createLocation} from '../serverApi/metadataApi';

const client = () => {
  const get = jest
    .fn()
    .mockResolvedValue({data: [{id: 'location-type', isLocation: true}]});
  const post = jest
    .fn()
    .mockResolvedValue({data: {id: 'created', name: 'Basement'}});
  return {get, post, axios: {get, post} as unknown as AxiosInstance};
};
test('creates a nested location using the server location entity type', async () => {
  const mock = client();
  const result = await createLocation(
    mock.axios,
    ' Basement ',
    'Storage',
    'house',
  );
  expect(mock.post).toHaveBeenCalledWith('/api/v1/entities', {
    name: 'Basement',
    description: 'Storage',
    parentId: 'house',
    quantity: 1,
    entityTypeId: 'location-type',
    tagIds: [],
  });
  expect(result.data?.id).toBe('created');
});
test('configures a location type for servers that do not have one yet', async () => {
  const mock = client();
  mock.get.mockResolvedValueOnce({data: []});
  mock.post.mockResolvedValueOnce({data: {id: 'new-type', isLocation: true}});
  await createLocation(mock.axios, 'Garage');
  expect(mock.post).toHaveBeenNthCalledWith(1, '/api/v1/entity-types', {
    name: 'Location',
    isLocation: true,
  });
  expect(mock.post).toHaveBeenNthCalledWith(
    2,
    '/api/v1/entities',
    expect.objectContaining({entityTypeId: 'new-type', parentId: null}),
  );
});
test('creates a label through the tag API and returns its display model', async () => {
  const mock = client();
  mock.post.mockResolvedValueOnce({
    data: {id: 'tools', name: 'Tools', description: 'Equipment'},
  });
  const response = await createLabel(mock.axios, ' Tools ', 'Equipment');
  expect(mock.post).toHaveBeenCalledWith('/api/v1/tags', {
    name: 'Tools',
    description: 'Equipment',
  });
  expect(response.data).toMatchObject({id: 'tools', name: 'Tools'});
});
test('rejects invalid names before making a mutation', async () => {
  const mock = client();
  expect((await createLocation(mock.axios, ' ')).success).toBe(false);
  expect((await createLabel(mock.axios, 'a'.repeat(256))).success).toBe(false);
  expect(mock.post).not.toHaveBeenCalled();
});
