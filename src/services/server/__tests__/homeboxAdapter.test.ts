import {
  HOMEBOX_ENDPOINTS,
  HomeboxEntity,
  mapHomeboxEntity,
  mapHomeboxTree,
  toHomeboxEntityCreate,
  toHomeboxEntityUpdate,
} from '../homeboxAdapter';

describe('Homebox adapter', () => {
  it('preserves a container parent and explicit location when editing in the same location', () => {
    const location = {
      id: 'basement',
      name: 'Basement',
      entityType: {id: 'location', isLocation: true},
    };
    const current: HomeboxEntity = {
      id: 'tool',
      name: 'Tool',
      quantity: 1,
      parent: {
        id: 'box',
        name: 'Box',
        entityType: {id: 'item', isLocation: false},
      },
      location,
      locationId: 'basement',
    };
    expect(
      toHomeboxEntityUpdate(
        {id: 'tool', name: 'Renamed', quantity: 1, locationId: 'basement'},
        current,
      ),
    ).toEqual(
      expect.objectContaining({parentId: 'box', locationId: 'basement'}),
    );
    expect(
      toHomeboxEntityUpdate(
        {id: 'tool', name: 'Moved', quantity: 1, locationId: 'attic'},
        current,
      ),
    ).toEqual(expect.objectContaining({parentId: 'attic'}));
  });
  it('keeps the current Homebox route contract in one place', () => {
    expect(HOMEBOX_ENDPOINTS.status).toBe('/api/v1/status');
    expect(HOMEBOX_ENDPOINTS.login).toBe('/api/v1/users/login');
    expect(HOMEBOX_ENDPOINTS.entities).toBe('/api/v1/entities');
    expect(HOMEBOX_ENDPOINTS.entity('item/1')).toBe(
      '/api/v1/entities/item%2F1',
    );
    expect(HOMEBOX_ENDPOINTS.entityAttachments('item/1')).toBe(
      '/api/v1/entities/item%2F1/attachments',
    );
    expect(HOMEBOX_ENDPOINTS.tags).toBe('/api/v1/tags');
  });

  it('maps an entity and its nearest location into app types', () => {
    const entity: HomeboxEntity = {
      id: 'item-1',
      name: 'Camera',
      description: 'Body',
      quantity: 2,
      assetId: '123-456789',
      entityType: {id: 'item', isLocation: false},
      location: {
        id: 'shelf-1',
        name: 'Shelf 1',
        entityType: {id: 'location', isLocation: true},
      },
      tags: [{id: 'tag-1', name: 'Photo'}],
      imageId: 'attachment-1',
      insured: true,
      purchasePrice: 99,
    };

    expect(mapHomeboxEntity(entity)).toEqual(
      expect.objectContaining({
        id: 'item-1',
        name: 'Camera',
        quantity: 2,
        assetId: '123-456789',
        barcode: '123-456789',
        location: expect.objectContaining({id: 'shelf-1'}),
        labels: [{id: 'tag-1', name: 'Photo'}],
        imageId: 'attachment-1',
        insured: true,
        purchasePrice: 99,
      }),
    );
  });

  it('builds official create and full-update payloads without dropping fields', () => {
    const create = toHomeboxEntityCreate({
      name: '  Camera  ',
      description: 'Body',
      quantity: 2,
      locationId: 'shelf-1',
      labels: ['tag-1'],
      assetId: '123-456789',
    });

    expect(create).toEqual({
      name: 'Camera',
      description: 'Body',
      quantity: 2,
      parentId: 'shelf-1',
      tagIds: ['tag-1'],
    });

    const current: HomeboxEntity = {
      id: 'item-1',
      name: 'Old name',
      parent: {id: 'old-shelf', name: 'Old shelf'},
      manufacturer: 'Acme',
      modelNumber: 'M1',
      serialNumber: 'S1',
      notes: 'Keep me',
      fields: [{id: 'field-1', textValue: 'value'}],
      entityType: {id: 'item', isLocation: false},
    };

    const update = toHomeboxEntityUpdate(
      {
        id: 'item-1',
        name: 'New name',
        description: 'Updated',
        quantity: 3,
        locationId: 'new-shelf',
        labels: ['tag-2'],
        assetId: '987-654321',
        purchasePrice: 25,
        insured: true,
      },
      current,
    );

    expect(update).toEqual(
      expect.objectContaining({
        id: 'item-1',
        name: 'New name',
        parentId: 'new-shelf',
        tagIds: ['tag-2'],
        assetId: '987-654321',
        manufacturer: 'Acme',
        modelNumber: 'M1',
        serialNumber: 'S1',
        notes: 'Keep me',
        fields: [{id: 'field-1', textValue: 'value'}],
      }),
    );
  });

  it('maps the official location tree recursively', () => {
    expect(
      mapHomeboxTree({
        id: 'room-1',
        name: 'Room',
        type: 'location',
        children: [{id: 'shelf-1', name: 'Shelf', type: 'location'}],
      }),
    ).toEqual({
      id: 'room-1',
      name: 'Room',
      type: 'location',
      children: [
        {id: 'shelf-1', name: 'Shelf', type: 'location', children: []},
      ],
    });
  });
});
