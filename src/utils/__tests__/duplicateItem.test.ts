import {duplicateItemTemplate} from '../duplicateItem';
import {Item} from '../../types';

test('copies common details without retaining unique identity, archive state, or attachments', () => {
  const source: Item = {
    id: 'original',
    name: 'Drill',
    description: 'Cordless',
    quantity: 2,
    location: {id: 'garage', name: 'Garage', description: ''},
    labels: [{id: 'tools', name: 'Tools'}],
    insured: true,
    purchasePrice: 90,
    assetId: '123',
    barcode: '123',
    archived: true,
    imageId: 'photo',
    attachments: [{id: 'receipt'}],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-02',
  };
  const copy = duplicateItemTemplate(source);
  expect(copy).toMatchObject({
    name: 'Drill (copy)',
    description: 'Cordless',
    quantity: 2,
    insured: true,
    purchasePrice: 90,
    assetId: '',
    barcode: '',
    id: '',
    archived: false,
    attachments: [],
    imageId: null,
  });
  expect(copy.location).toEqual(source.location);
  expect(copy.labels).toEqual(source.labels);
  copy.labels[0].name = 'Changed';
  expect(source.labels[0].name).toBe('Tools');
  expect(source.assetId).toBe('123');
});
