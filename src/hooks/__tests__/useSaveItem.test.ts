import {act, renderHook} from '@testing-library/react-native';
import {useSaveItem} from '../useSaveItem';
import ServerService from '../../services/serverService';

jest.mock('../../services/serverService');

const params = {
  imageUri: null,
  enabledFields: {
    description: true,
    purchasePrice: true,
    insured: true,
    labels: true,
  },
  formData: {name: 'Tool', quantity: '1'},
  selectedLocation: {
    id: 'basement',
    name: 'Basement',
    description: '',
    itemCount: 0,
    imageId: null,
  },
  selectedLabels: [],
};

it('keeps the saved item and warning after optional fields fail', async () => {
  const createItem = jest.fn().mockResolvedValue({
    success: true,
    data: {id: 'saved'},
    warning: 'Optional fields failed',
  });
  (ServerService.getInstance as jest.Mock).mockReturnValue({createItem});
  const {result} = await renderHook(() => useSaveItem());
  let saved;
  await act(async () => {
    saved = await result.current.saveItem(params);
  });
  expect(saved).toEqual({
    success: true,
    item: {id: 'saved'},
    warning: 'Optional fields failed',
  });
});

it('rejects unsupported scanned IDs before creating an item', async () => {
  const createItem = jest.fn();
  (ServerService.getInstance as jest.Mock).mockReturnValue({createItem});
  const {result} = await renderHook(() => useSaveItem());
  const saved = await result.current.saveItem({
    ...params,
    formData: {...params.formData, barcode: 'https://example.com/item'},
  });
  expect(saved.validationError).toContain('numeric');
  expect(createItem).not.toHaveBeenCalled();
});
