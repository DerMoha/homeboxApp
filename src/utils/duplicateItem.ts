import {Item} from '../types';

/** A duplicate is a new entity, with its own identity and attachments. */
export function duplicateItemTemplate(source: Item): Item {
  return {
    name: `${source.name} (copy)`.slice(0, 255),
    description: source.description,
    quantity: source.quantity,
    location: source.location ? {...source.location} : null,
    labels: source.labels.map(label => ({...label})),
    insured: source.insured,
    purchasePrice: source.purchasePrice,
    id: '',
    assetId: '',
    barcode: '',
    archived: false,
    imageId: null,
    attachments: [],
    createdAt: '',
    updatedAt: '',
  };
}
