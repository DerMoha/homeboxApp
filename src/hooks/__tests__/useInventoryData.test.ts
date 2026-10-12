import {act, renderHook} from '@testing-library/react-native';
import {useInventoryData} from '../useInventoryData';
import ServerService from '../../services/serverService';

jest.mock('../../services/serverService');

it('loads and retains inventory beyond the first 50 items', async () => {
  const items = Array.from({length: 75}, (_, index) => ({
    id: String(index),
    name: `Item ${index}`,
    quantity: 1,
    location: null,
  }));
  const getInventory = jest
    .fn()
    .mockResolvedValue({success: true, data: {items, total: 75}});
  (ServerService.getInstance as jest.Mock).mockReturnValue({getInventory});
  const {result} = await renderHook(() => useInventoryData());
  await act(async () => {
    await result.current.loadInventory();
  });
  expect(getInventory).toHaveBeenCalledWith(-1, -1);
  expect(result.current.inventory).toHaveLength(75);
});
